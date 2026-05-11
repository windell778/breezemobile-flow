import { allEvents, campaignSummaries, sessions, servicePageSummaries, visitors } from "@/lib/mock-data";
import type { EventName, Session, Visitor } from "@/lib/mock-data";
import { eventLabels } from "@/lib/labels";

export function getSession(sessionId: string) {
  return sessions.find((session) => session.session_id === sessionId);
}

export function getVisitor(visitorId: string): Visitor | undefined {
  return visitors.find((visitor) => visitor.visitor_id === visitorId);
}

export function getVisitorSessions(visitorId: string) {
  return sessions
    .filter((session) => session.visitor_id === visitorId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function sessionHasEvent(session: Session, eventName: EventName) {
  return session.events.some((event) => event.event_name === eventName);
}

export function mainEvent(session: Session): EventName {
  if (sessionHasEvent(session, "whatsapp_click")) return "whatsapp_click";
  if (sessionHasEvent(session, "service_click")) return "service_click";
  return "page_view_custom";
}

export function mainEventLabel(session: Session) {
  const eventName = mainEvent(session);
  if (eventName === "page_view_custom" && session.events.length === 1) return "Sin interaccion";
  return eventLabels[eventName];
}

export function getDashboardMetrics() {
  const whatsappClicks = allEvents.filter((event) => event.event_name === "whatsapp_click").length;
  const serviceClicks = allEvents.filter((event) => event.event_name === "service_click").length;
  const recordings = sessions.filter((session) => session.recording.available).length;

  return {
    sessions: sessions.length,
    visitors: visitors.length,
    events: allEvents.length,
    whatsappClicks,
    serviceClicks,
    recordings,
    replayRate: Math.round((recordings / sessions.length) * 100),
    topCampaign: campaignSummaries[0],
    topService: servicePageSummaries[0],
  };
}

export function buildVisitorSummary(visitorSessions: Session[]) {
  const first = visitorSessions[0];
  const last = visitorSessions[visitorSessions.length - 1];
  const hasWhatsapp = visitorSessions.some((session) => sessionHasEvent(session, "whatsapp_click"));
  const hasService = visitorSessions.some((session) => sessionHasEvent(session, "service_click"));
  const services = visitorSessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.service] = (acc[session.service] || 0) + 1;
    return acc;
  }, {});
  const primaryService = Object.entries(services).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";

  return {
    first,
    last,
    primaryService,
    firstSource: first?.source || "Direct",
    lastSource: last?.source || "Direct",
    lastEvent: last ? mainEvent(last) : "page_view_custom",
    state: hasWhatsapp ? "Alta intencion" : hasService ? "Media intencion" : "Sin interaccion",
  };
}

export function getPostHogAdapterNotes() {
  return [
    "PostHog sera la fuente primaria para eventos, visitantes, sesiones y grabaciones.",
    "Las consultas deben vivir en route handlers del servidor para no exponer personal API keys.",
    "La UI actual usa mocks con la misma forma esperada para poder cambiar la fuente despues.",
  ];
}
