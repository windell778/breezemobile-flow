export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterBar";
import { StatTile } from "@/components/ui/Panel";
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
      description="Revisa las acciones capturadas en la web: páginas vistas, clicks en servicios y clicks a WhatsApp."
    >
      <section className="grid gap-3 md:grid-cols-3">
        {counts.map((item) => (
          <Link key={item.eventName} href={`/eventos?event=${item.eventName}`} className="block">
            <StatTile
              label={eventLabels[item.eventName]}
              value={item.count}
              detail={item.eventName}
              className={
                selectedEvent === item.eventName
                  ? "border-slate-950 ring-2 ring-slate-100"
                  : "bf-panel-hover"
              }
            />
          </Link>
        ))}
      </section>

      {selectedEvent ? (
        <div className="mt-4">
          <FilterChip href="/eventos" tone="warning">
            Evento: {humanValue(selectedEvent)} ×
          </FilterChip>
        </div>
      ) : null}

      {visibleEvents.length === 0 ? (
        <EmptyState
          title="No hay eventos con este filtro"
          message="Selecciona otro tipo de evento o vuelve a la lista completa."
        />
      ) : (
        <DataTable
          headers={["Fecha", "Evento", "Visitante / sesión", "Página", "CTA"]}
          className="bf-defer mt-4 [--cols:170px_1.05fr_1fr_1.15fr_1fr]"
        >
          {visibleEvents.map((event) => (
            <div
              key={event.event_id}
              className="bf-apple-row grid gap-3 px-4 py-4 text-sm md:grid-cols-[170px_1.05fr_1fr_1.15fr_1fr] md:items-center"
            >
              <span className="font-mono text-[12px] text-[var(--apple-secondary-label)]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--apple-tertiary-label)] md:hidden">
                  Fecha
                </span>
                {formatDateTime(event.timestamp)}
              </span>
              <span className="min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--apple-tertiary-label)] md:hidden">
                  Evento
                </span>
                <span className="bf-apple-pill text-[var(--apple-label)]">
                  {eventLabels[event.event_name]}
                </span>
                <small className="mt-1 block truncate font-mono text-[11px] text-[var(--apple-tertiary-label)]">
                  {event.event_name}
                </small>
              </span>
              <Link
                href={`/visitantes/${event.visitor_id}?session=${event.session_id}&tab=eventos`}
                title={`${event.visitor_id} / ${event.session_id}`}
                className="min-w-0 font-mono text-[12px] font-semibold text-[var(--apple-blue)] hover:underline"
              >
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--apple-tertiary-label)] md:hidden">
                  Visitante / sesión
                </span>
                {shortId(event.visitor_id)} / {shortId(event.session_id)}
              </Link>
              <span className="min-w-0 text-[var(--apple-secondary-label)]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--apple-tertiary-label)] md:hidden">
                  Página
                </span>
                <span className="block truncate font-mono text-[12px] text-[var(--apple-label)]">{event.page_path}</span>
                <small className="block truncate text-[var(--apple-tertiary-label)]">{humanValue(event.service)}</small>
              </span>
              <span className="min-w-0 text-[var(--apple-secondary-label)]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--apple-tertiary-label)] md:hidden">
                  CTA
                </span>
                <span className="block truncate font-medium text-[var(--apple-label)]">{event.cta_text || "Sin dato"}</span>
                <small className="block truncate text-[var(--apple-tertiary-label)]">{event.cta_location || "Sin dato"}</small>
                <Link
                  href={`/sesiones?event=${event.event_name}`}
                  className="bf-apple-action mt-1 min-h-7 px-2.5 text-[11px]"
                >
                  Ver sesiones
                </Link>
              </span>
            </div>
          ))}
        </DataTable>
      )}
    </AppShell>
  );
}
