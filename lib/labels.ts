import type { EventName, ServiceKey } from "@/lib/data/types";

export const fieldLabels: Record<string, string> = {
  visitor_id: "Visitante",
  session_id: "Sesión",
  event_name: "Evento",
  event_id: "ID de evento",
  page_path: "Página",
  page_title: "Título de página",
  page_url: "URL de página",
  service: "Servicio",
  source: "Fuente",
  utm_source: "Fuente",
  utm_medium: "Medio",
  utm_campaign: "Campaña",
  utm_content: "Anuncio / Creativo",
  utm_term: "Término / Segmento",
  campaign_id: "ID de campaña",
  adset_id: "ID de conjunto",
  ad_id: "ID de anuncio",
  cta_text: "CTA tocado",
  cta_location: "Ubicación del CTA",
  link_url: "Destino",
  timestamp: "Fecha y hora",
  duration: "Duración",
  referrer: "Referencia",
};

export const eventLabels: Record<EventName, string> = {
  page_view_custom: "Página vista",
  service_click: "Click en servicio",
  whatsapp_click: "Click en WhatsApp",
};

export const serviceLabels: Record<ServiceKey, string> = {
  aire_acondicionado: "Aire acondicionado",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  suspension: "Suspensión",
  general: "General",
};

export function humanField(field: string) {
  return fieldLabels[field] || field;
}

export function humanValue(value: string | boolean | null | undefined) {
  if (value === true) return "Si";
  if (value === false) return "No";
  if (value == null || value === "") return "n/a";
  if (value in eventLabels) return eventLabels[value as EventName];
  if (value in serviceLabels) return serviceLabels[value as ServiceKey];
  if (value === "paid_social") return "Paid Social";
  if (value === "cpc") return "CPC";
  if (value === "seo") return "SEO";
  return String(value).replaceAll("_", " ");
}

// Returns the unique display fragment of an ID.
// For IDs with the pattern prefix_timestamp_suffix (like sess_17787..._cie4wf7),
// extracts the suffix after the last underscore — the only part that differs.
// Falls back to the first 8 characters for IDs without underscores (UUIDs, etc.).
export function shortId(id: string): string {
  const lastUnderscore = id.lastIndexOf("_");
  if (lastUnderscore !== -1 && id.length - lastUnderscore - 1 >= 4) {
    return id.slice(lastUnderscore + 1);
  }
  return id.slice(0, 8);
}

export function formatDateTime(value: string) {
  // PostHog HogQL timestamps have no timezone suffix — treat as UTC explicitly.
  const normalized = value.includes("T") || value.endsWith("Z") ? value : value.replace(" ", "T") + "Z";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(normalized));
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "Sin duración";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function readableReferrer(value: string) {
  if (!value) return "Sin referencia";
  if (value.includes("facebook")) return "Facebook";
  if (value.includes("google")) return "Google";
  return value;
}
