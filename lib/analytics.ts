import type { EventName, Session } from "@/lib/data/types";
import { eventLabels } from "@/lib/labels";
import { DEFAULT_WORKSPACE_CONFIG, mainEventForSession } from "@/lib/workspace-config";

export function sessionHasEvent(session: Session, eventName: EventName) {
  return session.events.some((event) => event.event_name === eventName);
}

export function mainEvent(session: Session): EventName {
  return mainEventForSession(session.events, DEFAULT_WORKSPACE_CONFIG);
}

export function mainEventLabel(session: Session) {
  const eventName = mainEvent(session);
  if (eventName === "page_view_custom" && session.events.length === 1) return "Sin interaccion";
  return eventLabels[eventName];
}

export function buildVisitorSummary(visitorSessions: Session[]) {
  const first = visitorSessions[0];
  const last = visitorSessions[visitorSessions.length - 1];
  const config = DEFAULT_WORKSPACE_CONFIG;
  const hasHighIntent = visitorSessions.some((session) =>
    session.events.some((e) => config.semanticRules.highIntentSignal.includes(e.event_name))
  );
  const hasService = visitorSessions.some((session) =>
    session.events.some((e) => config.intentRules.medium.includes(e.event_name))
  );
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
    state: hasHighIntent ? "Alta intencion" : hasService ? "Media intencion" : "Sin interaccion",
  };
}

export function getPostHogAdapterNotes() {
  return [
    "PostHog es la fuente primaria para eventos, visitantes, sesiones y grabaciones.",
    "Las consultas viven en route handlers del servidor para no exponer personal API keys.",
    "La UI usa el adaptador canonico: DATA_SOURCE=posthog activa datos reales, mock activa datos locales.",
  ];
}
