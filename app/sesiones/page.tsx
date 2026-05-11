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
      session.page_path,
      session.page_title,
      session.source,
    ].join(" ").toLowerCase();

    return matchesFilter && (!query || searchable.includes(query));
  });

  return (
    <AppShell
      title="Sesiones"
      description="Registro filtrable de sesiones capturadas por el tracking interno. Desde aqui se abre Visitor Intelligence o la pestana de grabaciones con la sesion activa."
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={String(params.q || "")}
            placeholder="Buscar por sesion, visitante, servicio, campana o pagina..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
          <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Buscar</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={`/sesiones?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                filter === item.key ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {visible.map((session) => (
          <article key={session.session_id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">Sesion {session.session_id}</p>
                  <p className="text-sm text-slate-500">Visitante {session.visitor_id}</p>
                  <StatusBadge label={session.recording.available ? "Grabacion disponible" : "Sin grabacion"} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{humanValue(session.service)} · {session.page_path}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <SourceBadge source={session.source} />
                <StatusBadge label={`${session.intent_level} intencion`} />
                <StatusBadge label={mainEventLabel(session)} />
              </div>

              <div className="text-sm text-slate-600">
                <p><span className="text-slate-400">Campana:</span> {session.attribution.utm_campaign || "Sin campana"}</p>
                <p className="mt-1"><span className="text-slate-400">Hora:</span> {formatDateTime(session.timestamp)} · {session.duration}</p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Ver visitante
                </Link>
                {session.recording.available ? (
                  <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800">
                    Ver replay
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
