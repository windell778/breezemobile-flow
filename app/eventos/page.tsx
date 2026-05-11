import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { allEvents, eventTypes } from "@/lib/mock-data";
import { eventLabels, formatDateTime, humanValue } from "@/lib/labels";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const selectedEvent = String(params.event || "");
  const counts = eventTypes.map((eventName) => ({
    eventName,
    count: allEvents.filter((event) => event.event_name === eventName).length,
  }));
  const visibleEvents = selectedEvent ? allEvents.filter((event) => event.event_name === selectedEvent) : allEvents;

  return (
    <AppShell
      title="Eventos"
      description="Explorador de eventos reales de V0: pagina vista, click en servicio y click en WhatsApp. No modela etapas comerciales posteriores."
    >
      <section className="grid gap-3 md:grid-cols-3">
        {counts.map((item) => (
          <Link
            key={item.eventName}
            href={`/eventos?event=${item.eventName}`}
            className={`bf-panel bf-panel-hover p-3 ${
              selectedEvent === item.eventName ? "border-slate-950 ring-2 ring-slate-100" : "border-slate-200"
            }`}
          >
            <p className="text-sm text-slate-500">{eventLabels[item.eventName]}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{item.count}</p>
            <p className="mt-2 font-mono text-xs text-slate-400">{item.eventName}</p>
          </Link>
        ))}
      </section>

      {selectedEvent ? (
        <div className="mt-4">
          <Link href="/eventos" className="bf-chip border-amber-200 bg-amber-50 text-amber-800">
            Evento: {humanValue(selectedEvent)} x
          </Link>
        </div>
      ) : null}

      <section className="bf-panel bf-defer mt-4 overflow-hidden">
        <div className="grid border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[170px_1fr_1fr_1fr_1fr]">
          <span>Fecha</span><span>Evento</span><span>Visitante / sesion</span><span>Pagina</span><span>CTA</span>
        </div>
        {visibleEvents.map((event) => (
          <div key={event.event_id} className="bf-row grid gap-2 px-3 py-2.5 text-sm md:grid-cols-[170px_1fr_1fr_1fr_1fr]">
            <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
            <span>
              <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
              <small className="block font-mono text-xs text-slate-400">{event.event_name}</small>
            </span>
            <Link href={`/visitantes/${event.visitor_id}?session=${event.session_id}&tab=eventos`} className="font-medium text-blue-700 hover:underline">
              {event.visitor_id} / {event.session_id}
            </Link>
            <span className="text-slate-600">{event.page_path}<small className="block text-slate-400">{humanValue(event.service)}</small></span>
            <span className="text-slate-600">
              {event.cta_text || "n/a"}
              <small className="block text-slate-400">{event.cta_location || "n/a"}</small>
              <Link href={`/sesiones?event=${event.event_name}`} className="mt-1 block text-xs font-medium text-blue-700 hover:underline">
                Ver sesiones con este evento
              </Link>
            </span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
