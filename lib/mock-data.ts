export type Source = "Meta Ads" | "Google Ads" | "Direct" | "Organic";
export type Service = "Aire acondicionado" | "Cambio de aceite" | "Frenos" | "Suspensión";
export type IntentLevel = "Alta" | "Media" | "Baja";

export type Session = {
  visitorId: string;
  sessionId: string;
  source: Source;
  medium: string;
  campaign: string;
  ad: string;
  page: string;
  service: Service;
  event: "Página vista" | "Click en servicio" | "Click en WhatsApp";
  whatsappClick: boolean;
  serviceClick: boolean;
  timestamp: string;
  duration: string;
  intentLevel: IntentLevel;
  hasReplay: boolean;
};

export const services: Service[] = [
  "Aire acondicionado",
  "Cambio de aceite",
  "Frenos",
  "Suspensión",
];

export const campaigns = [
  { name: "AC GAM Mayo", source: "Meta Ads" as const, budgetLevel: "Alto" },
  { name: "Frenos Urgente GAM", source: "Google Ads" as const, budgetLevel: "Medio" },
  { name: "Cambio Aceite Express", source: "Meta Ads" as const, budgetLevel: "Medio" },
  { name: "Suspensión GAM", source: "Organic" as const, budgetLevel: "Bajo" },
];

export const events = ["Página vista", "Click en servicio", "Click en WhatsApp"] as const;

export const sessions: Session[] = [
  {
    visitorId: "VIS-9012",
    sessionId: "SES-77031",
    source: "Meta Ads",
    medium: "Paid Social",
    campaign: "AC GAM Mayo",
    ad: "Promo enfriamiento 24h",
    page: "/servicios/aire-acondicionado",
    service: "Aire acondicionado",
    event: "Click en WhatsApp",
    whatsappClick: true,
    serviceClick: true,
    timestamp: "2026-05-11T10:42:00Z",
    duration: "06:14",
    intentLevel: "Alta",
    hasReplay: true,
  },
  {
    visitorId: "VIS-8931",
    sessionId: "SES-77018",
    source: "Google Ads",
    medium: "Paid Search",
    campaign: "Frenos Urgente GAM",
    ad: "Frenos hoy mismo",
    page: "/servicios/frenos",
    service: "Frenos",
    event: "Click en servicio",
    whatsappClick: false,
    serviceClick: true,
    timestamp: "2026-05-11T10:19:00Z",
    duration: "03:27",
    intentLevel: "Media",
    hasReplay: true,
  },
  {
    visitorId: "VIS-8804",
    sessionId: "SES-76995",
    source: "Direct",
    medium: "Directo",
    campaign: "Sin campaña",
    ad: "N/A",
    page: "/servicios/cambio-de-aceite",
    service: "Cambio de aceite",
    event: "Página vista",
    whatsappClick: false,
    serviceClick: false,
    timestamp: "2026-05-11T09:58:00Z",
    duration: "01:45",
    intentLevel: "Baja",
    hasReplay: false,
  },
  {
    visitorId: "VIS-8778",
    sessionId: "SES-76974",
    source: "Organic",
    medium: "SEO",
    campaign: "Suspensión GAM",
    ad: "Blog mantenimiento",
    page: "/servicios/suspension",
    service: "Suspensión",
    event: "Click en WhatsApp",
    whatsappClick: true,
    serviceClick: true,
    timestamp: "2026-05-11T09:41:00Z",
    duration: "05:02",
    intentLevel: "Alta",
    hasReplay: false,
  },
];

export const leads = [
  { leadId: "LEAD-221", sessionId: "SES-77031", service: "Aire acondicionado", status: "Cotización enviada" },
  { leadId: "LEAD-222", sessionId: "SES-76974", service: "Suspensión", status: "Primer contacto" },
  { leadId: "LEAD-223", sessionId: "SES-77018", service: "Frenos", status: "Pendiente respuesta" },
];

export const journeySteps = [
  "Meta Ads",
  "Landing",
  "Sesión",
  "WhatsApp",
  "Lead",
  "Cotización",
  "Venta",
] as const;
