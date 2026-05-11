import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { allEvents, eventTypes } from "@/lib/mock-data";
import { eventLabels, formatDateTime, humanValue } from "@/lib/labels";

export default function EventosPage() {
  const counts = eventTypes.map((eventName) => ({
    eventName,
    count: allEvents.filter((event) => event.event_name === eventName).length,
  }));

  return (
    <AppShell
      title="Eventos"
      description="Explorador de eventos reales de V0: pagina vista, click en servicio y click en WhatsApp. No modela etapas comerciales posteriores."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {counts.map((item) => (
          <div key={item.eventName} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{eventLabels[item.eventName]}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{item.count}</p>
            <p className="mt-2 font-mono text-xs text-slate-400">{item.eventName}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[170px_1fr_1fr_1fr_1fr]">
          <span>Fecha</span><span>Evento</span><span>Visitante / sesion</span><span>Pagina</span><span>CTA</span>
        </div>
        {allEvents.map((event) => (
          <div key={event.event_id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-[170px_1fr_1fr_1fr_1fr]">
            <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
            <span>
              <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
              <small className="block font-mono text-xs text-slate-400">{event.event_name}</small>
            </span>
            <Link href={`/visitantes/${event.visitor_id}?session=${event.session_id}&tab=eventos`} className="font-medium text-cyan-700 hover:underline">
              {event.visitor_id} / {event.session_id}
            </Link>
            <span className="text-slate-600">{event.page_path}<small className="block text-slate-400">{humanValue(event.service)}</small></span>
            <span className="text-slate-600">{event.cta_text || "n/a"}<small className="block text-slate-400">{event.cta_location || "n/a"}</small></span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
