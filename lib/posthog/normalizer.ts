// Maps raw PostHog API responses to the canonical internal types.
// If PostHog changes its API shape, only this file needs updating.

import type {
  Attribution,
  CampaignSummary,
  EventName,
  IntentLevel,
  RecordingRef,
  RecordingStatus,
  ServiceKey,
  Session,
  Source,
  TrackingEvent,
  Visitor,
} from "@/lib/data/types";

// ─── PostHog raw response shapes ─────────────────────────────────────────────

export type PHEvent = {
  id: string;
  distinct_id: string;
  event: string;
  timestamp: string;
  properties: Record<string, string | number | boolean | null>;
};

export type PHEventsResponse = {
  results: PHEvent[];
  next: string | null;
};

export type PHPerson = {
  id: string;
  distinct_ids: string[];
  properties: Record<string, string | number | boolean | null>;
  created_at: string;
};

export type PHPersonsResponse = {
  results: PHPerson[];
  next: string | null;
};

export type PHRecording = {
  id: string;
  distinct_id: string;
  start_time: string;
  end_time: string;
  duration: number;        // seconds
  storage: string;
  viewed: boolean;
  person?: {
    properties?: Record<string, unknown>;
  };
};

export type PHRecordingsResponse = {
  results: PHRecording[];
  next: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function inferSource(props: Record<string, unknown>): Source {
  const medium = str(props.utm_medium).toLowerCase();
  const source = str(props.utm_source).toLowerCase();
  if (medium === "paid_social" || source === "facebook" || source === "instagram") return "Meta Ads";
  if (medium === "cpc" || source === "google") return "Google Ads";
  if (medium === "seo" || medium === "organic" || source === "organic") return "Organic";
  return "Direct";
}

function inferIntentLevel(events: TrackingEvent[]): IntentLevel {
  if (events.some((e) => e.event_name === "whatsapp_click")) return "Alta";
  if (events.some((e) => e.event_name === "service_click")) return "Media";
  return "Baja";
}

function normalizeServiceKey(raw: unknown): ServiceKey {
  const s = str(raw).toLowerCase();
  const valid: ServiceKey[] = ["aire_acondicionado", "cambio_aceite", "frenos", "suspension", "general"];
  return valid.includes(s as ServiceKey) ? (s as ServiceKey) : "general";
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeEvent(e: PHEvent, workspaceId: string): TrackingEvent {
  const p = e.properties;
  const attribution: Attribution = {
    utm_source: str(p.utm_source),
    utm_medium: str(p.utm_medium),
    utm_campaign: str(p.utm_campaign),
    utm_content: str(p.utm_content),
    utm_term: str(p.utm_term),
    campaign_id: str(p.campaign_id),
    adset_id: str(p.adset_id),
    ad_id: str(p.ad_id),
    fbclid: str(p.fbclid),
    fbp: str(p.fbp),
    fbc: str(p.fbc),
    referrer: str(p.referrer ?? p.$referrer),
  };

  const validEventNames: EventName[] = ["page_view_custom", "service_click", "whatsapp_click"];
  const eventName: EventName = validEventNames.includes(e.event as EventName)
    ? (e.event as EventName)
    : "page_view_custom";

  return {
    workspace_id: workspaceId,
    event_id: str(p.event_id || e.id),
    event_name: eventName,
    visitor_id: str(p.visitor_id || e.distinct_id),
    session_id: str(p.session_id),
    timestamp: e.timestamp,
    page_path: str(p.page_path ?? p.$pathname),
    page_title: str(p.page_title ?? p.$title),
    service: normalizeServiceKey(p.service),
    cta_text: str(p.cta_text) || undefined,
    cta_location: str(p.cta_location) || undefined,
    link_url: str(p.link_url) || undefined,
    source: inferSource(p),
    attribution,
    payload: Object.fromEntries(
      Object.entries(p).map(([k, v]) => [k, str(v)]),
    ),
  };
}

export function normalizeVisitor(person: PHPerson, workspaceId: string, sessionIds: string[]): Visitor {
  const visitorId = str(person.properties.visitor_id || person.distinct_ids[0]);
  return {
    workspace_id: workspaceId,
    visitor_id: visitorId,
    first_seen: person.created_at,
    last_seen: str(person.properties.last_seen || person.created_at),
    session_count: sessionIds.length,
    sessions: sessionIds,
  };
}

export function normalizeRecording(
  rec: PHRecording,
  workspaceId: string,
  sessionId: string,
  storageKey: string | null,
): RecordingRef {
  // Recordings returned by PostHog API are streamable via /snapshots/ — mark as available.
  // storageKey is reserved for future self-hosted R2 copies.
  const status: RecordingStatus = "available";
  return {
    workspace_id: workspaceId,
    recording_id: rec.id,
    session_id: sessionId,
    visitor_id: rec.distinct_id,
    provider: "posthog",
    status,
    duration: rec.duration ?? null,
    started_at: rec.start_time,
    storage_key: storageKey,
    captured_at: new Date().toISOString(),
  };
}

// Groups events by session_id and builds Session objects.
// Called from persons.ts after fetching all events for a visitor.
export function buildSessionsFromEvents(
  events: TrackingEvent[],
  recordings: RecordingRef[],
  workspaceId: string,
): Session[] {
  const bySession = events.reduce<Record<string, TrackingEvent[]>>((acc, e) => {
    if (!e.session_id) return acc;
    (acc[e.session_id] ||= []).push(e);
    return acc;
  }, {});

  return Object.entries(bySession).map(([sessionId, sessionEvents]) => {
    const first = sessionEvents[0];
    const recording = recordings.find((r) => r.session_id === sessionId) ?? null;
    const sorted = [...sessionEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Derive campaign key for summaries
    const campaignSummary: CampaignSummary = {
      workspace_id: workspaceId,
      name: first.attribution.utm_campaign || "Sin campaña",
      source: first.source,
      medium: first.attribution.utm_medium || "none",
      campaign_id: first.attribution.campaign_id,
      sessions: 1,
      page_views: sessionEvents.filter((e) => e.event_name === "page_view_custom").length,
      service_clicks: sessionEvents.filter((e) => e.event_name === "service_click").length,
      whatsapp_clicks: sessionEvents.filter((e) => e.event_name === "whatsapp_click").length,
      recordings: recording?.status === "available" ? 1 : 0,
    };
    void campaignSummary; // available for future aggregation use

    return {
      workspace_id: workspaceId,
      visitor_id: first.visitor_id,
      session_id: sessionId,
      source: first.source,
      service: first.service,
      page_path: first.page_path,
      page_title: first.page_title,
      page_url: str(first.payload.page_url),
      timestamp: sorted[0].timestamp,
      duration: null, // PostHog does not return session duration via Events API
      intent_level: inferIntentLevel(sessionEvents),
      attribution: first.attribution,
      recording: recording ?? {
        workspace_id: workspaceId,
        recording_id: "",
        session_id: sessionId,
        visitor_id: first.visitor_id,
        provider: "posthog",
        status: "missing",
        duration: null,
        started_at: sorted[0].timestamp,
        storage_key: null,
        captured_at: new Date().toISOString(),
      },
      events: sorted,
    } satisfies Session;
  });
}
