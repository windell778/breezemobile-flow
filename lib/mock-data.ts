export type EventName = "page_view_custom" | "service_click" | "whatsapp_click";
export type Source = "Meta Ads" | "Google Ads" | "Organic" | "Direct";
export type ServiceKey = "aire_acondicionado" | "cambio_aceite" | "frenos" | "suspension" | "general";
export type IntentLevel = "Alta" | "Media" | "Baja";

export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  campaign_id: string;
  adset_id: string;
  ad_id: string;
  fbclid: string;
  fbp: string;
  fbc: string;
  referrer: string;
};

export type TrackingEvent = {
  event_id: string;
  event_name: EventName;
  visitor_id: string;
  session_id: string;
  timestamp: string;
  page_path: string;
  page_title: string;
  service: ServiceKey;
  cta_text?: string;
  cta_location?: string;
  link_url?: string;
  source: Source;
  attribution: Attribution;
  payload: Record<string, string>;
};

export type RecordingRef = {
  recording_id: string;
  session_id: string;
  visitor_id: string;
  provider: "PostHog";
  available: boolean;
  duration: string;
  started_at: string;
};

export type Session = {
  visitor_id: string;
  session_id: string;
  source: Source;
  service: ServiceKey;
  page_path: string;
  page_title: string;
  page_url: string;
  timestamp: string;
  duration: string;
  intent_level: IntentLevel;
  attribution: Attribution;
  recording: RecordingRef;
  events: TrackingEvent[];
};

export type Visitor = {
  visitor_id: string;
  first_seen: string;
  last_seen: string;
  sessions: string[];
};

export type CampaignSummary = {
  name: string;
  source: Source;
  medium: string;
  campaign_id: string;
  sessions: number;
  page_views: number;
  service_clicks: number;
  whatsapp_clicks: number;
  recordings: number;
};

export type ServicePageSummary = {
  service: ServiceKey;
  path: string;
  title: string;
  sessions: number;
  page_views: number;
  service_clicks: number;
  whatsapp_clicks: number;
  recordings: number;
};

export type TrackingHealth = {
  id: string;
  severity: "Alto" | "Medio" | "Bajo";
  area: "Tracking" | "Atribucion" | "Replay";
  title: string;
  detail: string;
  recommendation: string;
};

export const eventTypes: EventName[] = ["page_view_custom", "service_click", "whatsapp_click"];
export const serviceKeys: ServiceKey[] = ["aire_acondicionado", "cambio_aceite", "frenos", "suspension", "general"];

const attribution = (values: Partial<Attribution>): Attribution => ({
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  campaign_id: "",
  adset_id: "",
  ad_id: "",
  fbclid: "",
  fbp: "",
  fbc: "",
  referrer: "",
  ...values,
});

const makeEvent = (
  base: Omit<TrackingEvent, "payload">,
): TrackingEvent => ({
  ...base,
  payload: {
    event_id: base.event_id,
    event_name: base.event_name,
    visitor_id: base.visitor_id,
    session_id: base.session_id,
    page_path: base.page_path,
    page_title: base.page_title,
    service: base.service,
    cta_text: base.cta_text || "",
    cta_location: base.cta_location || "",
    link_url: base.link_url || "",
    utm_source: base.attribution.utm_source,
    utm_medium: base.attribution.utm_medium,
    utm_campaign: base.attribution.utm_campaign,
    utm_content: base.attribution.utm_content,
    utm_term: base.attribution.utm_term,
    campaign_id: base.attribution.campaign_id,
    adset_id: base.attribution.adset_id,
    ad_id: base.attribution.ad_id,
    referrer: base.attribution.referrer,
  },
});

const session = (input: Omit<Session, "events" | "recording"> & {
  recording?: Partial<RecordingRef>;
  events: Omit<TrackingEvent, "visitor_id" | "session_id" | "page_path" | "page_title" | "service" | "source" | "attribution" | "payload">[];
}): Session => {
  const recording: RecordingRef = {
    recording_id: input.recording?.recording_id || "",
    session_id: input.session_id,
    visitor_id: input.visitor_id,
    provider: "PostHog",
    available: Boolean(input.recording?.available),
    duration: input.duration,
    started_at: input.timestamp,
  };

  return {
    ...input,
    recording,
    events: input.events.map((event) =>
      makeEvent({
        ...event,
        visitor_id: input.visitor_id,
        session_id: input.session_id,
        page_path: input.page_path,
        page_title: input.page_title,
        service: input.service,
        source: input.source,
        attribution: input.attribution,
      }),
    ),
  };
};

export const sessions: Session[] = [
  session({
    visitor_id: "v_8f3a2b",
    session_id: "s_001",
    source: "Meta Ads",
    service: "aire_acondicionado",
    page_path: "/servicios/aire-acondicionado",
    page_title: "Aire acondicionado movil",
    page_url: "https://breezemobile.cr/servicios/aire-acondicionado",
    timestamp: "2026-05-09T09:18:10-06:00",
    duration: "00:42",
    intent_level: "Baja",
    attribution: attribution({
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "AC GAM Mayo",
      utm_content: "video_15s",
      campaign_id: "238512901",
      adset_id: "ac_mobile_gam",
      ad_id: "video_15s_03",
      fbclid: "IwAR0v0",
      fbp: "fb.1.1715601200.123",
      fbc: "fb.1.1715601200.IwAR0v0",
      referrer: "https://facebook.com/",
    }),
    recording: { available: true, recording_id: "rec_s_001" },
    events: [
      { event_id: "evt_001_page", event_name: "page_view_custom", timestamp: "2026-05-09T09:18:10-06:00" },
    ],
  }),
  session({
    visitor_id: "v_8f3a2b",
    session_id: "s_002",
    source: "Direct",
    service: "aire_acondicionado",
    page_path: "/servicios/aire-acondicionado",
    page_title: "Aire acondicionado movil",
    page_url: "https://breezemobile.cr/servicios/aire-acondicionado",
    timestamp: "2026-05-09T11:06:21-06:00",
    duration: "01:18",
    intent_level: "Media",
    attribution: attribution({
      fbp: "fb.1.1715601200.123",
      referrer: "https://breezemobile.cr/servicios",
    }),
    recording: { available: true, recording_id: "rec_s_002" },
    events: [
      { event_id: "evt_002_page", event_name: "page_view_custom", timestamp: "2026-05-09T11:06:21-06:00" },
      {
        event_id: "evt_002_service",
        event_name: "service_click",
        timestamp: "2026-05-09T11:07:04-06:00",
        cta_text: "Ver aire acondicionado",
        cta_location: "services_grid",
        link_url: "/servicios/aire-acondicionado",
      },
    ],
  }),
  session({
    visitor_id: "v_8f3a2b",
    session_id: "s_003",
    source: "Meta Ads",
    service: "aire_acondicionado",
    page_path: "/servicios/aire-acondicionado",
    page_title: "Aire acondicionado movil",
    page_url: "https://breezemobile.cr/servicios/aire-acondicionado",
    timestamp: "2026-05-09T14:32:10-06:00",
    duration: "02:06",
    intent_level: "Alta",
    attribution: attribution({
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "AC GAM Mayo",
      utm_content: "retargeting_card",
      campaign_id: "238512901",
      adset_id: "ac_mobile_gam",
      ad_id: "static_retarget_02",
      fbclid: "IwAR0v9",
      fbp: "fb.1.1715601200.123",
      fbc: "fb.1.1715601200.IwAR0v9",
      referrer: "https://facebook.com/",
    }),
    recording: { available: true, recording_id: "rec_s_003" },
    events: [
      { event_id: "evt_003_page", event_name: "page_view_custom", timestamp: "2026-05-09T14:32:10-06:00" },
      {
        event_id: "evt_003_service",
        event_name: "service_click",
        timestamp: "2026-05-09T14:33:02-06:00",
        cta_text: "Ver aire acondicionado",
        cta_location: "services_grid",
        link_url: "/servicios/aire-acondicionado",
      },
      {
        event_id: "evt_003_wa",
        event_name: "whatsapp_click",
        timestamp: "2026-05-09T14:33:48-06:00",
        cta_text: "Agendar por WhatsApp",
        cta_location: "hero",
        link_url: "https://wa.me/50600000000",
      },
    ],
  }),
  session({
    visitor_id: "v_2e81aa",
    session_id: "s_004",
    source: "Google Ads",
    service: "frenos",
    page_path: "/servicios/frenos",
    page_title: "Frenos",
    page_url: "https://breezemobile.cr/servicios/frenos",
    timestamp: "2026-05-09T14:10:21-06:00",
    duration: "01:48",
    intent_level: "Media",
    attribution: attribution({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "Frenos Search",
      utm_content: "rsa_01",
      utm_term: "frenos a domicilio",
      campaign_id: "gads-9912",
      ad_id: "rsa_frenos_01",
      referrer: "https://google.com/",
    }),
    recording: { available: true, recording_id: "rec_s_004" },
    events: [
      { event_id: "evt_004_page", event_name: "page_view_custom", timestamp: "2026-05-09T14:10:21-06:00" },
      {
        event_id: "evt_004_service",
        event_name: "service_click",
        timestamp: "2026-05-09T14:11:15-06:00",
        cta_text: "Ver frenos",
        cta_location: "menu",
        link_url: "/servicios/frenos",
      },
    ],
  }),
  session({
    visitor_id: "v_c0a114",
    session_id: "s_005",
    source: "Meta Ads",
    service: "cambio_aceite",
    page_path: "/servicios/cambio-de-aceite",
    page_title: "Cambio de aceite",
    page_url: "https://breezemobile.cr/servicios/cambio-de-aceite",
    timestamp: "2026-05-09T13:38:42-06:00",
    duration: "00:58",
    intent_level: "Alta",
    attribution: attribution({
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "Aceite Promo Mayo",
      utm_content: "static_02",
      campaign_id: "238512902",
      adset_id: "aceite_gam",
      ad_id: "static_02",
      fbclid: "IwAR7x1",
      fbp: "fb.1.1715599200.456",
      fbc: "fb.1.1715599200.IwAR7x1",
      referrer: "https://facebook.com/",
    }),
    recording: { available: true, recording_id: "rec_s_005" },
    events: [
      { event_id: "evt_005_page", event_name: "page_view_custom", timestamp: "2026-05-09T13:38:42-06:00" },
      {
        event_id: "evt_005_wa",
        event_name: "whatsapp_click",
        timestamp: "2026-05-09T13:39:18-06:00",
        cta_text: "WhatsApp",
        cta_location: "sticky_bar",
        link_url: "https://wa.me/50600000000",
      },
    ],
  }),
  session({
    visitor_id: "v_f934ad",
    session_id: "s_006",
    source: "Direct",
    service: "general",
    page_path: "/servicios",
    page_title: "Servicios",
    page_url: "https://breezemobile.cr/servicios",
    timestamp: "2026-05-09T12:52:05-06:00",
    duration: "00:31",
    intent_level: "Baja",
    attribution: attribution({}),
    recording: { available: false },
    events: [
      { event_id: "evt_006_page", event_name: "page_view_custom", timestamp: "2026-05-09T12:52:05-06:00" },
    ],
  }),
  session({
    visitor_id: "v_81ac3e",
    session_id: "s_007",
    source: "Organic",
    service: "suspension",
    page_path: "/servicios/suspension",
    page_title: "Suspension",
    page_url: "https://breezemobile.cr/servicios/suspension",
    timestamp: "2026-05-09T11:41:32-06:00",
    duration: "00:26",
    intent_level: "Baja",
    attribution: attribution({
      utm_source: "organic",
      utm_medium: "seo",
      referrer: "https://google.com/search",
    }),
    recording: { available: false },
    events: [
      { event_id: "evt_007_page", event_name: "page_view_custom", timestamp: "2026-05-09T11:41:32-06:00" },
    ],
  }),
  session({
    visitor_id: "v_56bb90",
    session_id: "s_008",
    source: "Meta Ads",
    service: "suspension",
    page_path: "/servicios/suspension",
    page_title: "Suspension",
    page_url: "https://breezemobile.cr/servicios/suspension",
    timestamp: "2026-05-10T10:04:11-06:00",
    duration: "03:10",
    intent_level: "Alta",
    attribution: attribution({
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "Suspension GAM",
      utm_content: "carousel_01",
      campaign_id: "238512903",
      adset_id: "suspension_gam",
      ad_id: "carousel_01",
      fbclid: "IwAR9z2",
      fbp: "fb.1.1715680800.777",
      fbc: "fb.1.1715680800.IwAR9z2",
      referrer: "https://facebook.com/",
    }),
    recording: { available: false },
    events: [
      { event_id: "evt_008_page", event_name: "page_view_custom", timestamp: "2026-05-10T10:04:11-06:00" },
      {
        event_id: "evt_008_wa",
        event_name: "whatsapp_click",
        timestamp: "2026-05-10T10:05:42-06:00",
        cta_text: "Cotizar suspension",
        cta_location: "final_cta",
        link_url: "https://wa.me/50600000000",
      },
    ],
  }),
];

export const visitors: Visitor[] = Object.values(
  sessions.reduce<Record<string, Visitor>>((acc, current) => {
    const existing = acc[current.visitor_id];
    if (!existing) {
      acc[current.visitor_id] = {
        visitor_id: current.visitor_id,
        first_seen: current.timestamp,
        last_seen: current.timestamp,
        sessions: [current.session_id],
      };
      return acc;
    }

    existing.sessions.push(current.session_id);
    if (new Date(current.timestamp) < new Date(existing.first_seen)) existing.first_seen = current.timestamp;
    if (new Date(current.timestamp) > new Date(existing.last_seen)) existing.last_seen = current.timestamp;
    return acc;
  }, {}),
);

export const allEvents = sessions.flatMap((item) => item.events);

const countEvents = (items: Session[], eventName: EventName) =>
  items.reduce((total, item) => total + item.events.filter((event) => event.event_name === eventName).length, 0);

export const campaignSummaries: CampaignSummary[] = Object.values(
  sessions.reduce<Record<string, CampaignSummary>>((acc, item) => {
    const name = item.attribution.utm_campaign || "Sin campana";
    const key = `${item.source}-${name}`;
    acc[key] ||= {
      name,
      source: item.source,
      medium: item.attribution.utm_medium || "none",
      campaign_id: item.attribution.campaign_id,
      sessions: 0,
      page_views: 0,
      service_clicks: 0,
      whatsapp_clicks: 0,
      recordings: 0,
    };
    acc[key].sessions += 1;
    acc[key].page_views += countEvents([item], "page_view_custom");
    acc[key].service_clicks += countEvents([item], "service_click");
    acc[key].whatsapp_clicks += countEvents([item], "whatsapp_click");
    acc[key].recordings += item.recording.available ? 1 : 0;
    return acc;
  }, {}),
).sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks || b.sessions - a.sessions);

export const servicePageSummaries: ServicePageSummary[] = Object.values(
  sessions.reduce<Record<string, ServicePageSummary>>((acc, item) => {
    acc[item.page_path] ||= {
      service: item.service,
      path: item.page_path,
      title: item.page_title,
      sessions: 0,
      page_views: 0,
      service_clicks: 0,
      whatsapp_clicks: 0,
      recordings: 0,
    };
    acc[item.page_path].sessions += 1;
    acc[item.page_path].page_views += countEvents([item], "page_view_custom");
    acc[item.page_path].service_clicks += countEvents([item], "service_click");
    acc[item.page_path].whatsapp_clicks += countEvents([item], "whatsapp_click");
    acc[item.page_path].recordings += item.recording.available ? 1 : 0;
    return acc;
  }, {}),
).sort((a, b) => b.sessions - a.sessions);

export const trackingHealth: TrackingHealth[] = [
  {
    id: "health_missing_utm",
    severity: "Medio",
    area: "Atribucion",
    title: "Sesiones Direct sin UTM",
    detail: "Las sesiones directas se mantienen separadas y no heredan campanas previas del visitante.",
    recommendation: "Mantener UTMs a nivel de sesion y revisar links de anuncios antes del lanzamiento.",
  },
  {
    id: "health_no_recording",
    severity: "Bajo",
    area: "Replay",
    title: "Grabaciones no disponibles en parte del trafico",
    detail: "Algunas sesiones no tienen recording_id, por lo que replay debe mostrarse como no disponible.",
    recommendation: "Usar PostHog como fuente de grabaciones y mostrar estado claro por sesion.",
  },
  {
    id: "health_event_contract",
    severity: "Alto",
    area: "Tracking",
    title: "Contrato V0 limitado a 3 eventos",
    detail: "La interfaz solo debe afirmar page_view_custom, service_click y whatsapp_click.",
    recommendation: "No mostrar cotizacion, venta o revenue como datos reales hasta conectar resultados comerciales.",
  },
  {
    id: "health_capi_ready",
    severity: "Medio",
    area: "Atribucion",
    title: "event_id listo para deduplicacion futura",
    detail: "whatsapp_click incluye event_id, util para una fase posterior con n8n y Meta Conversions API.",
    recommendation: "Conservar event_id en payload tecnico y no exponerlo como metrica principal.",
  },
];

export const trackingFields = [
  "visitor_id",
  "session_id",
  "event_name",
  "event_id",
  "page_path",
  "page_title",
  "service",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "campaign_id",
  "adset_id",
  "ad_id",
  "cta_text",
  "cta_location",
  "link_url",
  "fbclid",
  "fbp",
  "fbc",
];
