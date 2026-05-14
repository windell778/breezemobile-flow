// PostHog Session Recordings API — server-side only.
// Handles fetching recording metadata and downloading rrweb snapshots.

import type { RecordingRef } from "@/lib/data/types";
import { PostHogClient } from "@/lib/posthog/client";
import {
  normalizeRecording,
  type PHRecordingsResponse,
} from "@/lib/posthog/normalizer";
import { getStorageKey } from "@/lib/storage/recordings";

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
      for (const source of sources) {
        if (source.source === "blob_v2" || source.source === "blob") {
          try {
            // Some PostHog plans return a presigned download URL directly in the source.
            // Otherwise fall back to the PostHog proxy endpoint.
            let blobRes: Response;
            if (source.url) {
              blobRes = await fetch(source.url);
              if (!blobRes.ok) throw new Error(`blob url ${blobRes.status}`);
            } else {
              // PostHog Cloud: blob_key query param, no source= param
              blobRes = await client.getStream(
                `/session_recordings/${recordingId}/snapshots/?blob_key=${source.blob_key}`,
              );
            }
            const blobText = await blobRes.text();
            for (const line of blobText.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const parsed = JSON.parse(trimmed) as Record<string, unknown>;
                const props = parsed?.properties as Record<string, unknown> | undefined;
                // $snapshot_items format (PostHog's internal re-chunked format)
                if (Array.isArray(props?.["$snapshot_items"])) {
                  events.push(...(props["$snapshot_items"] as unknown[]));
                } else if (Array.isArray(parsed?.data)) {
                  events.push(...(parsed.data as unknown[]));
                } else if (parsed?.type !== undefined) {
                  events.push(parsed);
                }
              } catch {
                // skip malformed line
              }
            }
          } catch (e) {
            console.warn(`[recordings] blob_v2 download failed for key ${source.blob_key}:`, e);
          }
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
