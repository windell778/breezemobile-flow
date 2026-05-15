// Canonical internal types for BreezeMobile Flow Intelligence.
// All adapters (mock, PostHog) must map their data to these types.
// Pages and components should import from here, not from lib/mock-data.ts.

export type EventName = "page_view_custom" | "service_click" | "whatsapp_click";
export type Source = "Meta Ads" | "Google Ads" | "Organic" | "Direct";
export type ServiceKey =
  | "aire_acondicionado"
  | "cambio_aceite"
  | "frenos"
  | "suspension"
  | "general";
export type IntentLevel = "Alta" | "Media" | "Baja";

export type RecordingStatus =
  | "available"   // recording exists and can be played
  | "missing"     // no recording associated with this session
  | "pending"     // session still in progress
  | "processing"  // webhook received, download in progress
  | "not_supported"; // source does not support replay

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
  workspace_id: string;
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
  workspace_id: string;
  recording_id: string;
  session_id: string;
  visitor_id: string;
  provider: "posthog";
  status: RecordingStatus;
  duration: number | null;   // seconds
  started_at: string;
  storage_key: string | null; // R2 key: "{workspace_id}/recordings/{recording_id}.json"
  captured_at: string;        // ISO timestamp when webhook was received
};

export type Session = {
  workspace_id: string;
  visitor_id: string;
  session_id: string;
  source: Source;
  service: ServiceKey;
  page_path: string;
  page_title: string;
  page_url: string;
  timestamp: string;
  duration: number | null;    // seconds
  intent_level: IntentLevel;
  attribution: Attribution;
  recording: RecordingRef | null;
  events: TrackingEvent[];
};

export type Visitor = {
  workspace_id: string;
  visitor_id: string;
  first_seen: string;
  last_seen: string;
  session_count: number;
  sessions: string[];
};

export type CampaignSummary = {
  workspace_id: string;
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
  workspace_id: string;
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
  workspace_id: string;
  id: string;
  severity: "Alto" | "Medio" | "Bajo";
  area: "Tracking" | "Atribucion" | "Replay";
  title: string;
  detail: string;
  recommendation: string;
};

export type SessionFilters = {
  eventName?: EventName;
  source?: Source;
  service?: ServiceKey;
  hasRecording?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export type EventFilters = {
  eventName?: EventName;
  visitorId?: string;
  sessionId?: string;
  service?: ServiceKey;
  limit?: number;
  offset?: number;
};

export type DashboardMetrics = {
  sessions: number;
  visitors: number;
  events: number;
  whatsappClicks: number;
  serviceClicks: number;
  recordings: number;
  replayRate: number;
  topCampaign: CampaignSummary | null;
  topService: ServicePageSummary | null;
  cached_at: string;
};
