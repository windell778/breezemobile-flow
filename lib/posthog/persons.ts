// PostHog Persons API queries — server-side only.

import type { RecordingRef, Session, Visitor } from "@/lib/data/types";
import {
  buildSessionsFromEvents,
} from "@/lib/posthog/normalizer";
import { fetchVisitorEvents } from "@/lib/posthog/events";
import { fetchVisitorRecordings } from "@/lib/posthog/recordings";

// Build a visitor profile from their events using HogQL (properties.visitor_id).
// Avoids PostHog /persons/?distinct_id= which uses PostHog's internal UUID,
// not our custom visitor_id stored in event properties.
export async function fetchVisitorProfile(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
): Promise<Visitor | null> {
  const events = await fetchVisitorEvents(projectId, apiKey, host, workspaceId, visitorId);
  if (events.length === 0) return null;

  const sessionIds = [...new Set(events.map((e) => e.session_id).filter(Boolean))];
  const timestamps = events.map((e) => e.timestamp).sort();

  return {
    workspace_id: workspaceId,
    visitor_id: visitorId,
    first_seen: timestamps[0],
    last_seen: timestamps[timestamps.length - 1],
    session_count: sessionIds.length,
    sessions: sessionIds,
  };
}

export async function fetchVisitorSessions(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
): Promise<Session[]> {
  const [events, recordings] = await Promise.all([
    fetchVisitorEvents(projectId, apiKey, host, workspaceId, visitorId),
    fetchVisitorRecordings(projectId, apiKey, host, workspaceId, visitorId).catch((err) => {
      console.warn(
        "[persons] fetchVisitorRecordings failed — showing sessions without recording data:",
        err instanceof Error ? err.message : String(err),
      );
      return [] as RecordingRef[];
    }),
  ]);

  return buildSessionsFromEvents(events, recordings, workspaceId);
}
