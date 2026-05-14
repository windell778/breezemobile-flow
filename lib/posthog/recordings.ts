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
    data.results.map(async (rec) => {
      // Try to find our internal session_id from the recording's events.
      // breeze-scripts.js registers session_id via posthog.register(),
      // so it appears as a property on every event including the recording's.
      // If not available, we fall back to matching by visitor_id + timestamp.
      const sessionId = await resolveSessionId(client, rec.id, visitorId);

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
  const data = await client.post<PHRecordingsResponse>("/query/", {
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

  const recId = String((data.results[0] as Record<string, unknown>).session_id ?? "");
  if (!recId) return null;

  const detail = await client.get<{ result: import("./normalizer").PHRecording }>(
    `/session_recordings/${recId}/`,
  );

  const storageKey = await getStorageKey(workspaceId, recId);
  return normalizeRecording(detail.result, workspaceId, sessionId, storageKey);
}

// Downloads the rrweb event stream for a recording from PostHog.
// Returns parsed rrweb events ready for rrweb-player.
// Called by the webhook handler after a session ends.
export async function downloadSnapshots(
  projectId: string,
  apiKey: string,
  host: string,
  recordingId: string,
): Promise<unknown[]> {
  const client = new PostHogClient({ projectId, apiKey, host });
  const res = await client.getStream(`/session_recordings/${recordingId}/snapshots/`);

  const text = await res.text();
  const events: unknown[] = [];

  // PostHog returns NDJSON (one JSON object per line).
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      // Each line may contain a "data" array of rrweb events.
      if (Array.isArray(parsed?.data)) {
        events.push(...parsed.data);
      } else {
        events.push(parsed);
      }
    } catch {
      // Skip malformed lines silently.
    }
  }

  return events;
}

// Tries to read session_id from a recording's first event properties.
async function resolveSessionId(
  client: PostHogClient,
  recordingId: string,
  fallbackVisitorId: string,
): Promise<string> {
  try {
    const detail = await client.get<{
      result: { properties?: Record<string, unknown> };
    }>(`/session_recordings/${recordingId}/`);
    const sessionId = String(detail.result?.properties?.session_id ?? "");
    if (sessionId) return sessionId;
  } catch {
    // Fall through to fallback.
  }
  // Fallback: use visitorId + recordingId as a synthetic key.
  return `${fallbackVisitorId}_${recordingId}`;
}
