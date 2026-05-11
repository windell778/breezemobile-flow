import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { sessions } from "@/lib/mock-data";
import { formatDateTime, humanValue } from "@/lib/labels";
import { mainEventLabel, sessionHasEvent } from "@/lib/analytics";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const filters = [
  { key: "todas", label: "Todas" },
  { key: "whatsapp", label: "WhatsApp click" },
  { key: "service", label: "Service click" },
  { key: "sin_interaccion", label: "Sin interaccion" },
  { key: "meta", label: "Meta Ads" },
  { key: "direct", label: "Direct" },
  { key: "replay", label: "Con replay" },
];

export default async function SesionesPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const filter = String(params.filter || "todas");
  const query = String(params.q || "").trim().toLowerCase();
  const service = String(params.service || "");
  const source = String(params.source || "");
  const event = String(params.event || "");
  const campaign = String(params.campaign || "").toLowerCase();

  const visible = sessions.filter((session) => {
    const matchesFilter =
      filter === "todas" ||
      (filter === "whatsapp" && sessionHasEvent(session, "whatsapp_click")) ||
      (filter === "service" && sessionHasEvent(session, "service_click")) ||
      (filter === "sin_interaccion" && session.events.length === 1) ||
      (filter === "meta" && session.source === "Meta Ads") ||
      (filter === "direct" && session.source === "Direct") ||
      (filter === "replay" && session.recording.available);

    const searchable = [
      session.session_id,
      session.visitor_id,
      humanValue(session.service),
      session.attribution.utm_campaign,
      session.attribution.utm_content,
      session.page_path,
      session.page_title,
      session.source,
    ].join(" ").toLowerCase();

    const matchesService = !service || session.service === service;
    const matchesSource = !source || session.source === source;
    const matchesEvent = !event || session.events.some((item) => item.event_name === event);
    const matchesCampaign = !campaign || session.attribution.utm_campaign.toLowerCase() === campaign;

    return matchesFilter && matchesService && matchesSource && matchesEvent && matchesCampaign && (!query || searchable.includes(query));
  });

  const whatsappCount = visible.filter((session) => sessionHasEvent(session, "whatsapp_click")).length;
  const replayCount = visible.filter((session) => session.recording.available).length;

  return (
    <AppShell
      title="Sesiones"
      description="Registro operativo de sesiones: entrada, visitante, fuente, campana, pagina, evento principal y replay. Es la puerta de entrada a Visitor Intelligence."
    >
      <section className="grid gap-3 md:grid-cols-4">
        <MiniMetric label="Sesiones visibles" value={visible.length} />
        <MiniMetric label="WhatsApp clicks" value={whatsappCount} />
        <MiniMetric label="Con replay" value={replayCount} />
        <MiniMetric label="Eventos V0" value="3 tipos" />
      </section>

      <section className="bf-panel mt-4 p-3">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={String(params.q || "")}
            placeholder="Buscar por sesion, visitante, servicio, campana, anuncio o pagina..."
            className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
          <button className="h-9 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">Buscar</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={`/sesiones?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`bf-chip ${
                filter === item.key ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {service ? <ActiveChip label={`Servicio: ${humanValue(service)}`} href="/sesiones" /> : null}
          {source ? <ActiveChip label={`Fuente: ${source}`} href="/sesiones" /> : null}
          {event ? <ActiveChip label={`Evento: ${humanValue(event)}`} href="/sesiones" /> : null}
          {campaign ? <ActiveChip label={`Campana: ${campaign}`} href="/sesiones" /> : null}
        </div>
      </section>

      <section className="bf-panel bf-defer mt-4 overflow-hidden">
        <div className="hidden grid-cols-[150px_180px_1.1fr_1fr_1fr_120px_150px] border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 xl:grid">
          <span>Inicio</span>
          <span>Sesion</span>
          <span>Visitante / servicio</span>
          <span>Fuente</span>
          <span>Atribucion</span>
          <span>Actividad</span>
          <span>Acciones</span>
        </div>

        {visible.map((session) => (
          <article key={session.session_id} className="bf-row grid gap-3 px-3 py-2.5 text-sm xl:grid-cols-[150px_180px_1.1fr_1fr_1fr_120px_150px] xl:items-center">
            <div className="text-slate-500">
              <p>{formatDateTime(session.timestamp)}</p>
              <p className="mt-1 font-mono text-xs">{session.duration}</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}`} className="font-mono font-semibold text-cyan-700 hover:underline">
                  {session.session_id}
                </Link>
                {session.recording.available ? (
                <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`} aria-label="Ver replay" className="rounded-md border border-blue-200 px-1.5 py-1 text-xs text-blue-700 hover:bg-blue-50">
                    replay
                  </Link>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">{session.events.length} eventos</p>
            </div>

            <div>
              <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}`} className="font-medium text-slate-950 hover:underline">
                Visitante {session.visitor_id}
              </Link>
              <p className="mt-1 text-slate-600">{humanValue(session.service)} - {session.page_path}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <SourceBadge source={session.source} />
              <StatusBadge label={`${session.intent_level} intencion`} />
            </div>

            <div>
              <p className="font-medium text-slate-950">{session.attribution.utm_campaign || "Sin campana"}</p>
              <p className="mt-1 text-slate-500">{session.attribution.utm_content || session.attribution.ad_id || "Sin anuncio"}</p>
            </div>

            <div>
              <StatusBadge label={mainEventLabel(session)} />
              <p className="mt-2 text-xs text-slate-500">{session.recording.available ? "Replay disponible" : "Sin replay"}</p>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}`} className="bf-control text-slate-700 hover:bg-slate-50">
                Ver visitante
              </Link>
              {session.recording.available ? (
                <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`} className="bf-control border-slate-950 bg-slate-950 text-white hover:bg-slate-800">
                  Ver replay
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActiveChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="bf-chip border-amber-200 bg-amber-50 text-amber-800">
      {label} x
    </Link>
  );
}
