// PostHog Session Recordings API — server-side only.
// Handles fetching recording metadata and downloading rrweb snapshots.

import { gunzipSync } from "zlib";
import type { RecordingRef } from "@/lib/data/types";
import { PostHogClient } from "@/lib/posthog/client";
import {
  normalizeRecording,
  type PHRecordingsResponse,
} from "@/lib/posthog/normalizer";
import { getStorageKey } from "@/lib/storage/recordings";

// PostHog compresses FullSnapshot (type 2) and large incremental snapshot data
// as base64-encoded gzip. Decompress on the server so rrweb-player receives
// plain JSON objects.
function decompressEventData(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    // PostHog stores gzip data as a binary/latin1 string, not base64.
    const buf = Buffer.from(data, "latin1");
    if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
      return JSON.parse(gunzipSync(buf).toString("utf8")) as unknown;
    }
    // Fallback: try base64 in case encoding varies across PostHog versions.
    const b64 = Buffer.from(data, "base64");
    if (b64.length >= 2 && b64[0] === 0x1f && b64[1] === 0x8b) {
      return JSON.parse(gunzipSync(b64).toString("utf8")) as unknown;
    }
  } catch {
    // not gzip — return as-is
  }
  return data;
}

// Recursively removes null/undefined nodes from rrweb snapshot trees.
// PostHog includes null entries in childNodes for blocked/masked elements;
// standard rrweb-player crashes on them with "Cannot read properties of undefined".
function sanitizeNode(node: unknown): unknown {
  if (node == null || typeof node !== "object") return node;
  const n = node as Record<string, unknown>;
  const result: Record<string, unknown> = { ...n };
  if (Array.isArray(result.childNodes)) {
    result.childNodes = (result.childNodes as unknown[])
      .filter((child) => child != null)
      .map(sanitizeNode);
  }
  return result;
}

function normalizeRRWebEvent(ev: Record<string, unknown>): Record<string, unknown> {
  let data = ev.data;
  if (typeof data === "string") {
    data = decompressEventData(data);
  }
  // Sanitize FullSnapshot (type 2) node tree to remove null/undefined nodes.
  if (ev.type === 2 && data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.node != null) {
      data = { ...d, node: sanitizeNode(d.node) };
    }
  }
  return { ...ev, data };
}

export async function fetchVisitorRecordings(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
): Promise<RecordingRef[]> {
  const client = new PostHogClient({ projectId, apiKey, host });

  // posthog.identify(visitorId) in breeze-scripts makes our visitor_id the PostHog distinct_id.
  // The /session_recordings/ endpoint requires person_uuid, not distinct_id directly.
  const persons = await client.get<{ results: Array<{ uuid: string }> }>("/persons/", {
    distinct_id: visitorId,
    limit: "1",
  });
  if (!persons.results?.length) return [];
  const personUuid = persons.results[0].uuid;

  const data = await client.get<PHRecordingsResponse>("/session_recordings/", {
    person_uuid: personUuid,
    limit: "50",
  });

  return Promise.all(
    (data.results ?? []).map(async (rec) => {
      // Read session_id from person.properties — set via posthog.register({ session_id }).
      // Falls back to a detail API call if not present in the list response.
      const sessionId =
        String(rec.person?.properties?.session_id ?? "").trim() ||
        (await resolveSessionId(client, rec.id, visitorId));

      const storageKey = await getStorageKey(workspaceId, rec.id);
      return normalizeRecording(rec, workspaceId, sessionId, storageKey);
    }),
  );
}

export async function fetchSessionRecording(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  sessionId: string,
): Promise<RecordingRef | null> {
  const client = new PostHogClient({ projectId, apiKey, host });

  // Query recordings that have our session_id as a property.
  const data = await client.post<{ results: unknown[][] }>("/query/", {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT session_id FROM session_recordings
        WHERE properties.session_id = '${sessionId}'
        LIMIT 1
      `,
    },
  });

  if (!data.results?.length) return null;

  const recId = String((data.results[0] as string[])[0] ?? "");
  if (!recId) return null;

  const detail = await client.get<{ id: string; distinct_id: string; start_time: string; end_time: string; duration: number; storage: string; viewed: boolean; person?: { properties?: Record<string, unknown> } }>(
    `/session_recordings/${recId}/`,
  );

  const storageKey = await getStorageKey(workspaceId, recId);
  return normalizeRecording(detail, workspaceId, sessionId, storageKey);
}

// Downloads the rrweb event stream for a recording from PostHog.
// Handles both the current blob_v2 format and the legacy NDJSON format.
export async function downloadSnapshots(
  projectId: string,
  apiKey: string,
  host: string,
  recordingId: string,
): Promise<unknown[]> {
  const client = new PostHogClient({ projectId, apiKey, host });
  const events: unknown[] = [];

  const manifestRes = await client.getStream(`/session_recordings/${recordingId}/snapshots/`);
  const manifestText = await manifestRes.text();

  // PostHog blob_v2 format: manifest is JSON with sources array.
  // The sources array is at the root (manifest.sources) in PostHog Cloud.
  try {
    const manifest = JSON.parse(manifestText) as {
      sources?: Array<{ source: string; blob_key: string; url?: string }>;
      events?: Array<{ sources?: Array<{ source: string; blob_key: string; url?: string }> }>;
    };
    // PostHog Cloud puts sources at root; some versions wrap it in events[0]
    const sources = manifest.sources ?? manifest.events?.[0]?.sources ?? [];

    if (sources.length > 0) {
      // Batch all blob_v2 chunks into a single request using start_blob_key / end_blob_key.
      // PostHog requires source=blob_v2 with these two params — blob_key alone returns the manifest.
      const blobKeys = sources
        .filter((s) => s.source === "blob_v2" || s.source === "blob_v2_lts")
        .map((s) => parseInt(s.blob_key, 10))
        .filter((k) => !isNaN(k))
        .sort((a, b) => a - b);

      if (blobKeys.length > 0) {
        const startKey = blobKeys[0];
        const endKey = blobKeys[blobKeys.length - 1];
        try {
          const blobRes = await client.getStream(
            `/session_recordings/${recordingId}/snapshots/?source=blob_v2&start_blob_key=${startKey}&end_blob_key=${endKey}&decompress=true`,
          );
          const blobText = await blobRes.text();
          for (const line of blobText.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed) as unknown;
              // PostHog blob_v2 NDJSON format: each line is [recording_id, rrweb_event]
              const event = Array.isArray(parsed) ? (parsed as unknown[])[1] : parsed;
              const ev = event as Record<string, unknown> | undefined;
              const props = ev?.properties as Record<string, unknown> | undefined;
              if (Array.isArray(props?.["$snapshot_items"])) {
                events.push(
                  ...(props["$snapshot_items"] as Record<string, unknown>[]).map(normalizeRRWebEvent),
                );
              } else if (ev?.type !== undefined) {
                events.push(normalizeRRWebEvent(ev));
              } else if (Array.isArray(ev?.data)) {
                events.push(...(ev.data as unknown[]));
              }
            } catch {
              // skip malformed line
            }
          }
        } catch (e) {
          console.warn(`[recordings] blob_v2 download failed (keys ${startKey}-${endKey}):`, e);
        }
      }
      return events;
    }
  } catch {
    // Not blob_v2 JSON — fall through to NDJSON parser
  }

  // Legacy NDJSON format (one JSON object per line)
  for (const line of manifestText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (Array.isArray(parsed?.data)) {
        events.push(...(parsed.data as unknown[]));
      } else {
        events.push(parsed);
      }
    } catch {
      // skip malformed line
    }
  }

  return events;
}

// Reads session_id from a recording detail response.
// The real shape is: { person: { properties: { session_id: "sess_..." } } }
async function resolveSessionId(
  client: PostHogClient,
  recordingId: string,
  fallbackVisitorId: string,
): Promise<string> {
  try {
    const detail = await client.get<{
      person?: { properties?: Record<string, unknown> };
      result?: { properties?: Record<string, unknown> };
    }>(`/session_recordings/${recordingId}/`);
    const sessionId = String(
      detail.person?.properties?.session_id ??
      detail.result?.properties?.session_id ??
      "",
    );
    if (sessionId) return sessionId;
  } catch {
    // fall through
  }
  return `${fallbackVisitorId}_${recordingId}`;
}
