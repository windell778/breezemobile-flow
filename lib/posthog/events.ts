// PostHog Events API queries — server-side only.

import type { Attribution, EventName, ServiceKey, Source, TrackingEvent } from "@/lib/data/types";
import { PostHogClient } from "@/lib/posthog/client";

const TRACKED_EVENTS = `event IN ('page_view_custom', 'service_click', 'whatsapp_click')`;

const EVENT_SELECT = `
  event AS event_name,
  toString(properties.event_id) AS event_id,
  toString(properties.visitor_id) AS visitor_id,
  toString(properties.session_id) AS session_id,
  toString(timestamp) AS ts,
  toString(properties.page_path) AS page_path,
  toString(properties.page_title) AS page_title,
  toString(properties.page_url) AS page_url,
  toString(properties.service) AS service,
  toString(properties.cta_text) AS cta_text,
  toString(properties.cta_location) AS cta_location,
  toString(properties.link_url) AS link_url,
  toString(properties.utm_source) AS utm_source,
  toString(properties.utm_medium) AS utm_medium,
  toString(properties.utm_campaign) AS utm_campaign,
  toString(properties.utm_content) AS utm_content,
  toString(properties.utm_term) AS utm_term,
  toString(properties.campaign_id) AS campaign_id,
  toString(properties.adset_id) AS adset_id,
  toString(properties.ad_id) AS ad_id,
  toString(properties.fbclid) AS fbclid,
  toString(properties.fbp) AS fbp,
  toString(properties.fbc) AS fbc,
  toString(properties.referrer) AS referrer
`;

type HogQLResponse = { results: unknown[][]; columns: string[] };

function s(v: unknown): string {
  return v == null ? "" : String(v);
}

function inferSource(r: Record<string, unknown>): Source {
  const medium = s(r.utm_medium).toLowerCase();
  const src = s(r.utm_source).toLowerCase();
  if (medium === "paid_social" || src === "facebook" || src === "instagram") return "Meta Ads";
  if (medium === "cpc" || src === "google") return "Google Ads";
  if (medium === "seo" || medium === "organic" || src === "organic") return "Organic";
  return "Direct";
}

function buildAttribution(r: Record<string, unknown>): Attribution {
  return {
    utm_source: s(r.utm_source),
    utm_medium: s(r.utm_medium),
    utm_campaign: s(r.utm_campaign),
    utm_content: s(r.utm_content),
    utm_term: s(r.utm_term),
    campaign_id: s(r.campaign_id),
    adset_id: s(r.adset_id),
    ad_id: s(r.ad_id),
    fbclid: s(r.fbclid),
    fbp: s(r.fbp),
    fbc: s(r.fbc),
    referrer: s(r.referrer),
  };
}

function rowToEvent(workspaceId: string, columns: string[], row: unknown[]): TrackingEvent {
  const r = Object.fromEntries(columns.map((col, i) => [col, row[i]]));
  const sessionId = s(r.session_id);
  const ts = s(r.ts);
  const validServiceKeys: ServiceKey[] = ["aire_acondicionado", "cambio_aceite", "frenos", "suspension", "general"];
  const rawService = s(r.service).toLowerCase();
  const service: ServiceKey = validServiceKeys.includes(rawService as ServiceKey) ? (rawService as ServiceKey) : "general";
  const validEventNames: EventName[] = ["page_view_custom", "service_click", "whatsapp_click"];
  const rawEvent = s(r.event_name);
  const event_name: EventName = validEventNames.includes(rawEvent as EventName) ? (rawEvent as EventName) : "page_view_custom";

  return {
    workspace_id: workspaceId,
    event_id: s(r.event_id) || `${sessionId}_${rawEvent}_${ts}`,
    event_name,
    visitor_id: s(r.visitor_id),
    session_id: sessionId,
    timestamp: ts,
    page_path: s(r.page_path) || "/",
    page_title: s(r.page_title),
    service,
    cta_text: s(r.cta_text) || undefined,
    cta_location: s(r.cta_location) || undefined,
    link_url: s(r.link_url) || undefined,
    source: inferSource(r),
    attribution: buildAttribution(r),
    payload: {},
  };
}

// Fetch all events for a visitor using HogQL filtered by properties.visitor_id.
// PostHog's /events/?distinct_id= uses PostHog's internal UUID, not our custom visitor_id.
export async function fetchVisitorEvents(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  visitorId: string,
  limit = 200,
): Promise<TrackingEvent[]> {
  const client = new PostHogClient({ projectId, apiKey, host });

  const data = await client.post<HogQLResponse>("/query/", {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT ${EVENT_SELECT}
        FROM events
        WHERE properties.visitor_id = '${visitorId}'
          AND ${TRACKED_EVENTS}
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `,
    },
  });

  return (data.results ?? []).map((row) => rowToEvent(workspaceId, data.columns, row));
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

  const data = await client.post<HogQLResponse>("/query/", {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT ${EVENT_SELECT}
        FROM events
        WHERE properties.session_id = '${sessionId}'
          AND ${TRACKED_EVENTS}
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `,
    },
  });

  return (data.results ?? []).map((row) => rowToEvent(workspaceId, data.columns, row));
}
