export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { eventLabels, formatDateTime, humanValue, shortId } from "@/lib/labels";
import type { EventName } from "@/lib/data/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const eventTypes: EventName[] = ["page_view_custom", "service_click", "whatsapp_click"];

export default async function EventosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const selectedEvent = String(params.event || "");

  const allEvents = await getAdapter().listEvents(DEFAULT_WORKSPACE_ID);

  const counts = eventTypes.map((eventName) => ({
    eventName,
    count: allEvents.filter((event) => event.event_name === eventName).length,
  }));
  const visibleEvents = selectedEvent
    ? allEvents.filter((event) => event.event_name === selectedEvent)
    : allEvents;

  return (
    <AppShell
      title="Eventos"
      description="Acciones capturadas: páginas vistas, clicks en servicios y clicks a WhatsApp."
    >
      {/* Cards de conteo por tipo */}
      <section
        className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border"
        style={{ background: "var(--color-border)", borderColor: "var(--color-border)" }}
      >
        {counts.map((item) => (
          <Link
            key={item.eventName}
            href={`/eventos?event=${item.eventName}`}
            className="flex flex-col px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]"
            style={{
              background: selectedEvent === item.eventName ? "var(--color-primary-bg)" : "var(--color-surface)",
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: selectedEvent === item.eventName ? "var(--color-primary)" : "var(--color-text-3)" }}
            >
              {eventLabels[item.eventName]}
            </span>
            <span
              className="mt-1.5 text-3xl font-bold tracking-tight"
              style={{ color: selectedEvent === item.eventName ? "var(--color-primary)" : "var(--color-text-1)" }}
            >
              {item.count}
            </span>
            <span className="mt-1 font-mono text-[10px]" style={{ color: "var(--color-text-3)" }}>
              {item.eventName}
            </span>
          </Link>
        ))}
      </section>

      {/* Chip activo */}
      {selectedEvent && (
        <div className="mt-4">
          <Link
            href="/eventos"
            className="bf-chip transition-colors"
            style={{
              borderColor: "oklch(88% 0.07 75)",
              background: "var(--color-warn-bg)",
              color: "var(--color-warn-text)",
            }}
          >
            Evento: {humanValue(selectedEvent)} ×
          </Link>
        </div>
      )}

      {/* Tabla de eventos */}
      {visibleEvents.length === 0 ? (
        <EmptyState message="No hay eventos que coincidan con el filtro seleccionado." />
      ) : (
        <section
          className="mt-4 overflow-hidden rounded-xl border bf-defer"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          {/* Cabecera */}
          <div
            className="hidden grid-cols-[150px_1fr_1fr_1fr_1fr] border-b px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] md:grid"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-3)",
            }}
          >
            <span>Fecha</span>
            <span>Evento</span>
            <span>Visitante / sesión</span>
            <span>Página</span>
            <span>CTA</span>
          </div>

          {visibleEvents.map((event) => (
            <div
              key={event.event_id}
              className="grid gap-2 border-b px-5 py-3 text-sm transition-colors hover:bg-[var(--color-surface-2)] md:grid-cols-[150px_1fr_1fr_1fr_1fr]"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span className="font-mono text-xs" style={{ color: "var(--color-text-3)" }}>
                {formatDateTime(event.timestamp)}
              </span>
              <span>
                <span className="font-medium" style={{ color: "var(--color-text-1)" }}>
                  {eventLabels[event.event_name]}
                </span>
                <small className="block font-mono text-[10px]" style={{ color: "var(--color-text-3)" }}>
                  {event.event_name}
                </small>
              </span>
              <Link
                href={`/visitantes/${event.visitor_id}?session=${event.session_id}&tab=eventos`}
                title={`${event.visitor_id} / ${event.session_id}`}
                className="font-mono text-xs font-medium transition-colors hover:underline"
                style={{ color: "var(--color-primary-text)" }}
              >
                {shortId(event.visitor_id)} / {shortId(event.session_id)}
              </Link>
              <span style={{ color: "var(--color-text-2)" }}>
                {event.page_path}
                <small className="block text-[10px]" style={{ color: "var(--color-text-3)" }}>
                  {humanValue(event.service)}
                </small>
              </span>
              <span style={{ color: "var(--color-text-2)" }}>
                {event.cta_text || "Sin dato"}
                <small className="block text-[10px]" style={{ color: "var(--color-text-3)" }}>
                  {event.cta_location || "Sin dato"}
                </small>
                <Link
                  href={`/sesiones?event=${event.event_name}`}
                  className="mt-1 block text-xs font-medium transition-colors hover:underline"
                  style={{ color: "var(--color-primary-text)" }}
                >
                  Ver sesiones con este evento
                </Link>
              </span>
            </div>
          ))}
        </section>
      )}
    </AppShell>
  );
}
