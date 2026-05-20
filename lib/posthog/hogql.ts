// HogQL-based implementations for aggregate and list queries.
// Used by PostHogAdapter for listSessions, listEvents, getDashboardMetrics, etc.
// Server-side only — never import from client components.

import { replayRate } from "@/lib/metrics";
import { DEFAULT_WORKSPACE_CONFIG, inferIntentLevel } from "@/lib/workspace-config";
import { unstable_cache } from "next/cache";
import type {
  Attribution,
  CampaignSummary,
  DashboardMetrics,
  EventFilters,
  EventName,
  IntentLevel,
  RecordingRef,
  ServiceKey,
  ServicePageSummary,
  Session,
  SessionFilters,
  Source,
  TrackingEvent,
  TrackingHealth,
} from "@/lib/data/types";
import { PostHogClient } from "./client";

type HogQLResponse = {
  results: unknown[][];
  columns: string[];
};

// Two-tier HogQL cache:
//
// runHogQL        — 60s TTL. For live queries: session lists, event lists, per-visitor data.
//                   These need near-real-time freshness as new sessions arrive continuously.
//
// runHogQLGolden  — 900s TTL, tagged "golden". For aggregate metrics: dashboard totals,
//                   campaign summaries, service summaries. These are pre-computed summaries
//                   that don't need second-by-second freshness. Inspired by the golden-layer
//                   pattern where stable aggregates are cached separately from live detail data.
//                   Invalidate with revalidateTag("golden") when a forced refresh is needed.

const _cachedHogQLPost = unstable_cache(
  async (projectId: string, apiKey: string, host: string, query: string): Promise<HogQLResponse> => {
    const client = new PostHogClient({ projectId, apiKey, host });
    return client.post<HogQLResponse>("/query/", {
      query: { kind: "HogQLQuery", query },
    });
  },
  ["posthog-hogql"],
  { revalidate: 60 },
);

const _cachedHogQLPostGolden = unstable_cache(
  async (projectId: string, apiKey: string, host: string, query: string): Promise<HogQLResponse> => {
    const client = new PostHogClient({ projectId, apiKey, host });
    return client.post<HogQLResponse>("/query/", {
      query: { kind: "HogQLQuery", query },
    });
  },
  ["posthog-hogql-golden"],
  { revalidate: 900, tags: ["golden"] },
);

async function runHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  query: string,
): Promise<HogQLResponse> {
  return _cachedHogQLPost(projectId, apiKey, host, query);
}

async function runHogQLGolden(
  projectId: string,
  apiKey: string,
  host: string,
  query: string,
): Promise<HogQLResponse> {
  return _cachedHogQLPostGolden(projectId, apiKey, host, query);
}

function toRow(columns: string[], row: unknown[]): Record<string, unknown> {
  return Object.fromEntries(columns.map((col, i) => [col, row[i]]));
}

function str(val: unknown): string {
  if (val == null) return "";
  return String(val);
}

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function inferSource(r: Record<string, unknown>): Source {
  const medium = str(r.utm_medium).toLowerCase();
  const src = str(r.utm_source).toLowerCase();
  if (medium === "paid_social" || src === "facebook" || src === "instagram") return "Meta Ads";
  if (medium === "cpc" || src === "google") return "Google Ads";
  if (medium === "seo" || medium === "organic" || src === "organic") return "Organic";
  return "Direct";
}

function _inferIntentLevel(events: TrackingEvent[]): IntentLevel {
  return inferIntentLevel(events, DEFAULT_WORKSPACE_CONFIG);
}

function buildAttribution(r: Record<string, unknown>): Attribution {
  return {
    utm_source: str(r.utm_source),
    utm_medium: str(r.utm_medium),
    utm_campaign: str(r.utm_campaign),
    utm_content: str(r.utm_content),
    utm_term: str(r.utm_term),
    campaign_id: str(r.campaign_id),
    adset_id: str(r.adset_id),
    ad_id: str(r.ad_id),
    fbclid: str(r.fbclid),
    fbp: str(r.fbp),
    fbc: str(r.fbc),
    referrer: str(r.referrer),
  };
}

const EVENT_FILTER = `event IN ('page_view_custom', 'service_click', 'whatsapp_click')`;
const SESSION_FILTER = `properties.session_id IS NOT NULL AND properties.session_id != ''`;
const RECORDINGS_DATE_FROM = "-30d";

// Fetches recent PostHog session recordings via REST API and returns a map keyed
// by our breeze session_id (stored in person.properties.session_id via posthog.register).
// Uses the same REST approach as Visitor Intelligence — HogQL's session_recordings
// table is not available in PostHog Cloud.
async function fetchRecordingsMap(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
): Promise<Map<string, RecordingRef>> {
  const map = new Map<string, RecordingRef>();
  try {
    const client = new PostHogClient({ projectId, apiKey, host });
    const data = await client.get<{
      results: Array<{
        id: string;
        distinct_id: string;
        start_time: string;
        duration: number;
        person?: { properties?: Record<string, unknown> };
      }>;
    }>("/session_recordings/", { limit: "200", date_from: RECORDINGS_DATE_FROM });

    for (const rec of data.results ?? []) {
      const sessionId = String(rec.person?.properties?.session_id ?? "").trim();
      if (!sessionId) continue;
      map.set(sessionId, {
        workspace_id: workspaceId,
        recording_id: rec.id,
        session_id: sessionId,
        visitor_id: rec.distinct_id,
        provider: "posthog",
        status: "available",
        duration: rec.duration ?? null,
        started_at: rec.start_time,
        storage_key: null,
        captured_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("[hogql] fetchRecordingsMap failed — sessions will show without recordings:", e);
  }
  return map;
}

const EVENT_COLUMNS = `
  event AS event_name,
  toString(properties.event_id) AS event_id,
  toString(properties.visitor_id) AS visitor_id,
  toString(properties.session_id) AS session_id,
  toString(timestamp) AS ts,
  toString(properties.page_path) AS page_path,
  toString(properties.page_title) AS page_title,
  toString(properties.page_url) AS page_url,
  toString(properties.service) AS service,
  toString(properties.source) AS source,
  toString(properties.intent_level) AS intent_level,
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

function rowToEvent(workspaceId: string, r: Record<string, unknown>): TrackingEvent {
  const sessionId = str(r.session_id);
  const ts = str(r.ts);
  return {
    workspace_id: workspaceId,
    event_id: str(r.event_id) || `${sessionId}_${str(r.event_name)}_${ts}`,
    event_name: str(r.event_name) as EventName,
    visitor_id: str(r.visitor_id),
    session_id: sessionId,
    timestamp: ts,
    page_path: str(r.page_path) || "/",
    page_title: str(r.page_title),
    service: (str(r.service) || "general") as ServiceKey,
    cta_text: str(r.cta_text) || undefined,
    cta_location: str(r.cta_location) || undefined,
    link_url: str(r.link_url) || undefined,
    source: inferSource(r),
    attribution: buildAttribution(r),
    payload: {},
  };
}

export async function listSessionsHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  filters?: SessionFilters,
): Promise<Session[]> {
  const sql = `
    SELECT ${EVENT_COLUMNS}
    FROM events
    WHERE ${EVENT_FILTER} AND ${SESSION_FILTER}
    ORDER BY timestamp DESC
    LIMIT 5000
  `;

  // Run events query and recordings query in parallel.
  const [result, recordingsMap] = await Promise.all([
    runHogQL(projectId, apiKey, host, sql),
    fetchRecordingsMap(projectId, apiKey, host, workspaceId),
  ]);

  const sessionMap = new Map<string, Session>();

  for (const row of result.results) {
    const r = toRow(result.columns, row);
    const sessionId = str(r.session_id);
    if (!sessionId) continue;

    const event = rowToEvent(workspaceId, r);

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        workspace_id: workspaceId,
        visitor_id: str(r.visitor_id),
        session_id: sessionId,
        source: inferSource(r),
        service: (str(r.service) || "general") as ServiceKey,
        page_path: str(r.page_path) || "/",
        page_title: str(r.page_title),
        page_url: str(r.page_url),
        timestamp: str(r.ts),
        duration: null,
        intent_level: "Baja",
        attribution: buildAttribution(r),
        recording: null,
        events: [],
      });
    }

    sessionMap.get(sessionId)!.events.push(event);
  }

  for (const session of sessionMap.values()) {
    if (session.events.length > 1) {
      const timestamps = session.events.map((e) => new Date(e.timestamp).getTime());
      session.duration = Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000);
      session.timestamp = new Date(Math.min(...timestamps)).toISOString();
    }
    session.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    session.intent_level = _inferIntentLevel(session.events);
    if (session.events[0]) {
      session.source = session.events[0].source;
    }

    // Associate recording if PostHog has one for this session.
    const recording = recordingsMap.get(session.session_id);
    session.recording = recording ?? {
      workspace_id: workspaceId,
      recording_id: "",
      session_id: session.session_id,
      visitor_id: session.visitor_id,
      provider: "posthog",
      status: "missing",
      duration: null,
      started_at: session.timestamp,
      storage_key: null,
      captured_at: new Date().toISOString(),
    };
  }

  let sessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (filters?.eventName) {
    sessions = sessions.filter((s) => s.events.some((e) => e.event_name === filters.eventName));
  }
  if (filters?.source) {
    sessions = sessions.filter((s) => s.source === filters.source);
  }
  if (filters?.medium) {
    const m = filters.medium.toLowerCase();
    sessions = sessions.filter((s) => (s.attribution.utm_medium.toLowerCase() || "none") === m);
  }
  if (filters?.content) {
    if (filters.content === "__missing__") {
      sessions = sessions.filter((s) => !s.attribution.utm_content && !s.attribution.ad_id);
    } else {
      const c = filters.content.toLowerCase();
      sessions = sessions.filter(
        (s) =>
          s.attribution.utm_content.toLowerCase() === c ||
          s.attribution.ad_id.toLowerCase() === c,
      );
    }
  }
  if (filters?.service) {
    sessions = sessions.filter(
      (s) =>
        s.service === filters.service ||
        s.events.some((e) => e.service === filters.service),
    );
  }
  if (filters?.hasRecording !== undefined) {
    sessions = sessions.filter((s) => (s.recording?.status === "available") === filters.hasRecording);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    sessions = sessions.filter(
      (s) =>
        s.session_id.toLowerCase().includes(q) ||
        s.visitor_id.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q) ||
        s.attribution.utm_campaign.toLowerCase().includes(q),
    );
  }

  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? sessions.length;
  return sessions.slice(offset, offset + limit);
}

export async function listEventsHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
  filters?: EventFilters,
): Promise<TrackingEvent[]> {
  const conditions: string[] = [EVENT_FILTER, SESSION_FILTER];
  if (filters?.eventName) {
    conditions.push(`event = '${filters.eventName}'`);
  }
  if (filters?.visitorId) {
    conditions.push(`properties.visitor_id = '${filters.visitorId}'`);
  }
  if (filters?.sessionId) {
    conditions.push(`properties.session_id = '${filters.sessionId}'`);
  }
  if (filters?.service) {
    conditions.push(`properties.service = '${filters.service}'`);
  }

  const limit = filters?.limit ?? 500;
  const offset = filters?.offset ?? 0;

  const sql = `
    SELECT ${EVENT_COLUMNS}
    FROM events
    WHERE ${conditions.join(" AND ")}
    ORDER BY timestamp DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const result = await runHogQL(projectId, apiKey, host, sql);
  return result.results.map((row) => rowToEvent(workspaceId, toRow(result.columns, row)));
}

export async function getDashboardMetricsHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
): Promise<DashboardMetrics> {
  return _cachedDashboardMetrics(projectId, apiKey, host, workspaceId);
}

const _cachedDashboardMetrics = unstable_cache(
  async (projectId: string, apiKey: string, host: string, workspaceId: string): Promise<DashboardMetrics> => {
    const sql = `
    SELECT
      uniq(properties.session_id) AS sessions,
      uniq(properties.visitor_id) AS visitors,
      count(*) AS events,
      countIf(event = 'whatsapp_click') AS whatsapp_clicks,
      countIf(event = 'service_click') AS service_clicks
    FROM events
    WHERE ${EVENT_FILTER} AND ${SESSION_FILTER}
  `;

    const [result, campaigns, services, recordingsMap] = await Promise.all([
      runHogQLGolden(projectId, apiKey, host, sql),
      getCampaignSummariesHogQL(projectId, apiKey, host, workspaceId),
      getServiceSummariesHogQL(projectId, apiKey, host, workspaceId),
      fetchRecordingsMap(projectId, apiKey, host, workspaceId),
    ]);

    const r = toRow(result.columns, result.results[0] ?? [0, 0, 0, 0, 0]);
    const totalSessions = num(r.sessions);
    const recordings = recordingsMap.size;

    return {
      sessions: totalSessions,
      visitors: num(r.visitors),
      events: num(r.events),
      whatsappClicks: num(r.whatsapp_clicks),
      serviceClicks: num(r.service_clicks),
      recordings,
      replayRate: replayRate(recordings, totalSessions),
      topCampaign: campaigns[0] ?? null,
      topService: services[0] ?? null,
      cached_at: new Date().toISOString(),
    };
  },
  ["posthog-dashboard-metrics"],
  { revalidate: 900, tags: ["golden"] },
);

export async function getCampaignSummariesHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
): Promise<CampaignSummary[]> {
  const sql = `
    SELECT
      toString(properties.utm_campaign) AS campaign,
      toString(any(properties.source)) AS source,
      toString(any(properties.utm_medium)) AS medium,
      toString(any(properties.campaign_id)) AS campaign_id,
      uniq(properties.session_id) AS sessions,
      countIf(event = 'page_view_custom') AS page_views,
      countIf(event = 'service_click') AS service_clicks,
      countIf(event = 'whatsapp_click') AS whatsapp_clicks
    FROM events
    WHERE ${EVENT_FILTER}
      AND properties.utm_campaign IS NOT NULL
      AND properties.utm_campaign != ''
    GROUP BY properties.utm_campaign
    ORDER BY whatsapp_clicks DESC, sessions DESC
    LIMIT 50
  `;

  const result = await runHogQLGolden(projectId, apiKey, host, sql);
  return result.results.map((row) => {
    const r = toRow(result.columns, row);
    return {
      workspace_id: workspaceId,
      name: str(r.campaign),
      source: (str(r.source) || "Direct") as Source,
      medium: str(r.medium),
      campaign_id: str(r.campaign_id),
      sessions: num(r.sessions),
      page_views: num(r.page_views),
      service_clicks: num(r.service_clicks),
      whatsapp_clicks: num(r.whatsapp_clicks),
      recordings: 0,
    };
  });
}

export async function getServiceSummariesHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
): Promise<ServicePageSummary[]> {
  const sql = `
    SELECT
      toString(properties.service) AS service,
      toString(any(properties.page_path)) AS path,
      toString(any(properties.page_title)) AS title,
      uniq(properties.session_id) AS sessions,
      countIf(event = 'page_view_custom') AS page_views,
      countIf(event = 'service_click') AS service_clicks,
      countIf(event = 'whatsapp_click') AS whatsapp_clicks
    FROM events
    WHERE ${EVENT_FILTER}
      AND properties.service IS NOT NULL
      AND properties.service != ''
    GROUP BY properties.service
    ORDER BY whatsapp_clicks DESC, sessions DESC
    LIMIT 50
  `;

  const result = await runHogQLGolden(projectId, apiKey, host, sql);
  return result.results.map((row) => {
    const r = toRow(result.columns, row);
    return {
      workspace_id: workspaceId,
      service: (str(r.service) || "general") as ServiceKey,
      path: str(r.path) || "/",
      title: str(r.title),
      sessions: num(r.sessions),
      page_views: num(r.page_views),
      service_clicks: num(r.service_clicks),
      whatsapp_clicks: num(r.whatsapp_clicks),
      recordings: 0,
    };
  });
}

// Tracking health based on real PostHog data signals. Cached at golden (900s).
//
// Uses two queries with different granularities:
//
// Query 1 — SESSION level (subquery with argMin):
//   A session is "sin UTM" if its FIRST event (by timestamp) has no utm_source
//   and no utm_medium. This matches how listSessionsHogQL builds attribution:
//   the landing event defines the session's attribution, not subsequent events.
//   Avoids the false-positive of uniqIf() on a flat scan, which would flag a
//   session if ANY of its events is missing UTM even if the landing had it.
//
// Query 2 — EVENT level (flat scan, no session grouping):
//   - wa_clicks_without_campaign: whatsapp_click events whose own payload does
//     not include utm_campaign. This is a payload-level validation, not a claim
//     about whether the session has a campaign. Text must say "evento", not "sesion".
//   - events_without_visitor_id: events missing visitor_id entirely — contract
//     violation that implies posthog.register() did not fire.
export async function getTrackingHealthHogQL(
  projectId: string,
  apiKey: string,
  host: string,
  workspaceId: string,
): Promise<TrackingHealth[]> {
  // Query 1: session-level UTM check via first-event attribution (argMin).
  const sessionSql = `
    SELECT
      uniq(session_id) AS total_sessions,
      uniqIf(
        session_id,
        first_utm_source = '' AND first_utm_medium = ''
      ) AS sessions_without_utm
    FROM (
      SELECT
        toString(properties.session_id) AS session_id,
        argMin(toString(properties.utm_source), timestamp) AS first_utm_source,
        argMin(toString(properties.utm_medium), timestamp) AS first_utm_medium
      FROM events
      WHERE ${EVENT_FILTER} AND ${SESSION_FILTER}
      GROUP BY session_id
    )
  `;

  // Query 2: event-level payload checks (no session grouping needed).
  const eventSql = `
    SELECT
      countIf(
        event = 'whatsapp_click'
        AND (toString(properties.utm_campaign) = '' OR properties.utm_campaign IS NULL)
      ) AS wa_clicks_without_campaign,
      countIf(
        toString(properties.visitor_id) = '' OR properties.visitor_id IS NULL
      ) AS events_without_visitor_id
    FROM events
    WHERE ${EVENT_FILTER}
  `;

  const [sessionRes, eventRes] = await Promise.all([
    runHogQLGolden(projectId, apiKey, host, sessionSql),
    runHogQLGolden(projectId, apiKey, host, eventSql),
  ]);

  const sr = toRow(sessionRes.columns, sessionRes.results[0] ?? []);
  const er = toRow(eventRes.columns, eventRes.results[0] ?? []);

  const totalSessions = num(sr.total_sessions);
  const sessionsWithoutUtm = num(sr.sessions_without_utm);
  const waClicksWithoutCampaign = num(er.wa_clicks_without_campaign);
  const eventsWithoutVisitorId = num(er.events_without_visitor_id);

  const items: TrackingHealth[] = [];

  // SESSION-level: sessions whose landing event has no UTM attribution.
  if (sessionsWithoutUtm > 0) {
    const pct = totalSessions > 0 ? Math.round((sessionsWithoutUtm / totalSessions) * 100) : 0;
    items.push({
      workspace_id: workspaceId,
      id: "health_missing_utm",
      severity: pct > 30 ? "Alto" : pct > 10 ? "Medio" : "Bajo",
      area: "Atribucion",
      title: `${sessionsWithoutUtm} sesiones sin atribucion UTM en landing (${pct}%)`,
      detail: "Sesiones cuyo primer evento no trae utm_source ni utm_medium. Se clasifican como Direct y no se atribuyen a ninguna campana.",
      recommendation: "Revisar links de anuncios y asegurar que todos incluyen parametros UTM antes del lanzamiento.",
    });
  }

  // EVENT-level: whatsapp_click events whose payload does not include utm_campaign.
  if (waClicksWithoutCampaign > 0) {
    items.push({
      workspace_id: workspaceId,
      id: "health_wa_no_campaign",
      severity: "Medio",
      area: "Atribucion",
      title: `${waClicksWithoutCampaign} eventos whatsapp_click sin utm_campaign en payload`,
      detail: "Estos eventos no traen utm_campaign en su propio payload. No implica necesariamente que la sesion no tenga campana — solo que el payload del evento especifico carece del campo.",
      recommendation: "Asegurar que los links de ads incluyen utm_campaign. Estos eventos no cuentan en el ranking de campanas.",
    });
  }

  // EVENT-level: events missing visitor_id — contract violation.
  if (eventsWithoutVisitorId > 0) {
    items.push({
      workspace_id: workspaceId,
      id: "health_missing_visitor_id",
      severity: "Alto",
      area: "Tracking",
      title: `${eventsWithoutVisitorId} eventos sin visitor_id`,
      detail: "Eventos llegando sin visitor_id en el payload. Indica que posthog.register() no se ejecuto antes de capturar el evento.",
      recommendation: "Verificar que el script de tracking esta activo en todas las paginas y que posthog.register() se ejecuta correctamente.",
    });
  }

  // Structural item: always shown as informational reminder of V0 scope.
  items.push({
    workspace_id: workspaceId,
    id: "health_event_contract",
    severity: "Bajo",
    area: "Tracking",
    title: "Contrato V0: 3 eventos activos",
    detail: "page_view_custom, service_click y whatsapp_click. No hay revenue, cotizaciones ni ventas en el contrato actual.",
    recommendation: "No mostrar datos comerciales reales hasta conectar Meta Ads API o CRM.",
  });

  return items;
}

// Kept for MockAdapter and fallback use only.
export function getTrackingHealthStatic(workspaceId: string): TrackingHealth[] {
  return [
    {
      workspace_id: workspaceId,
      id: "health_missing_utm",
      severity: "Medio",
      area: "Atribucion",
      title: "Sesiones Direct sin UTM",
      detail: "Las sesiones directas se mantienen separadas y no heredan campanas previas del visitante.",
      recommendation: "Mantener UTMs a nivel de sesion y revisar links de anuncios antes del lanzamiento.",
    },
    {
      workspace_id: workspaceId,
      id: "health_no_recording",
      severity: "Bajo",
      area: "Replay",
      title: "Grabaciones no disponibles en parte del trafico",
      detail: "Algunas sesiones no tienen recording_id, por lo que replay debe mostrarse como no disponible.",
      recommendation: "Usar PostHog como fuente de grabaciones y mostrar estado claro por sesion.",
    },
    {
      workspace_id: workspaceId,
      id: "health_event_contract",
      severity: "Alto",
      area: "Tracking",
      title: "Contrato V0 limitado a 3 eventos",
      detail: "La interfaz solo debe afirmar page_view_custom, service_click y whatsapp_click.",
      recommendation: "No mostrar cotizacion, venta o revenue como datos reales hasta conectar resultados comerciales.",
    },
    {
      workspace_id: workspaceId,
      id: "health_capi_ready",
      severity: "Medio",
      area: "Atribucion",
      title: "event_id listo para deduplicacion futura",
      detail: "whatsapp_click incluye event_id, util para una fase posterior con n8n y Meta Conversions API.",
      recommendation: "Conservar event_id en payload tecnico y no exponerlo como metrica principal.",
    },
  ];
}
