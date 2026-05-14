import type { EventName, ServiceKey } from "@/lib/data/types";

export const fieldLabels: Record<string, string> = {
  visitor_id: "Visitante",
  session_id: "Sesion",
  event_name: "Evento",
  event_id: "ID de evento",
  page_path: "Pagina",
  page_title: "Titulo de pagina",
  page_url: "URL de pagina",
  service: "Servicio",
  source: "Fuente",
  utm_source: "Fuente",
  utm_medium: "Medio",
  utm_campaign: "Campana",
  utm_content: "Anuncio / Creativo",
  utm_term: "Termino / Segmento",
  campaign_id: "ID de campana",
  adset_id: "ID de conjunto",
  ad_id: "ID de anuncio",
  cta_text: "CTA tocado",
  cta_location: "Ubicacion del CTA",
  link_url: "Destino",
  timestamp: "Fecha y hora",
  duration: "Duracion",
  referrer: "Referencia",
};

export const eventLabels: Record<EventName, string> = {
  page_view_custom: "Pagina vista",
  service_click: "Click en servicio",
  whatsapp_click: "Click en WhatsApp",
};

export const serviceLabels: Record<ServiceKey, string> = {
  aire_acondicionado: "Aire acondicionado",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  suspension: "Suspension",
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
  if (seconds == null) return "n/a";
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
