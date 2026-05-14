// PostHog Persons API queries — server-side only.

import type { Session, Visitor } from "@/lib/data/types";
import { PostHogClient } from "@/lib/posthog/client";
import {
  buildSessionsFromEvents,
  normalizeVisitor,
  type PHPersonsResponse,
} from "@/lib/posthog/normalizer";
import { fetchVisitorEvents } from "@/lib/posthog/events";
import { fetchVisitorRecordings } from "@/lib/posthog/recordings";

export async function fetchVisitorProfile(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
): Promise<Visitor | null> {
  const client = new PostHogClient({ projectId, apiKey, host });

  const data = await client.get<PHPersonsResponse>("/persons/", {
    distinct_id: visitorId,
  });

  const person = data.results.find((p) =>
    p.distinct_ids.includes(visitorId) ||
    String(p.properties.visitor_id) === visitorId,
  );

  if (!person) return null;

  // Get session IDs from events to populate sessions[].
  const events = await fetchVisitorEvents(projectId, apiKey, host, workspaceId, visitorId);
  const sessionIds = [...new Set(events.map((e) => e.session_id).filter(Boolean))];

  return normalizeVisitor(person, workspaceId, sessionIds);
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
      return [] as import("@/lib/data/types").RecordingRef[];
    }),
  ]);

  return buildSessionsFromEvents(events, recordings, workspaceId);
}
