// PostHog Events API queries — server-side only.

import type { TrackingEvent } from "@/lib/data/types";
import { PostHogClient } from "@/lib/posthog/client";
import { normalizeEvent, type PHEventsResponse } from "@/lib/posthog/normalizer";

const TRACKED_EVENTS = "page_view_custom,service_click,whatsapp_click";

export async function fetchVisitorEvents(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
  limit = 100,
): Promise<TrackingEvent[]> {
  const client = new PostHogClient({ projectId, apiKey, host });
  const data = await client.get<PHEventsResponse>("/events/", {
    distinct_id: visitorId,
    event: TRACKED_EVENTS,
    limit: String(limit),
  });

  return data.results.map((e) => normalizeEvent(e, workspaceId));
}

export async function fetchSessionEvents(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  sessionId: string,
  limit = 100,
): Promise<TrackingEvent[]> {
  const client = new PostHogClient({ projectId, apiKey, host });

  // PostHog does not expose a direct "filter by session_id" in Events API.
  // We filter by the session_id property that breeze-scripts.js registers
  // via posthog.register({ session_id }) — it appears in every event.
  const data = await client.post<PHEventsResponse>("/query/", {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT
          id, distinct_id, event, timestamp,
          properties
        FROM events
        WHERE properties.session_id = '${sessionId}'
          AND event IN ('page_view_custom', 'service_click', 'whatsapp_click')
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `,
    },
  });

  // HogQL returns results as columns; map back to PHEvent shape.
  // If PostHog returns standard format, fall through to normalizeEvent.
  if (Array.isArray(data.results)) {
    return (data.results as Parameters<typeof normalizeEvent>[0][]).map((e) =>
      normalizeEvent(e, workspaceId),
    );
  }

  return [];
}
