import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { sessions } from "@/lib/mock-data";
import { formatDateTime, humanValue } from "@/lib/labels";

export default function GrabacionesPage() {
  const recordings = sessions.filter((session) => session.recording.available);
  const missing = sessions.length - recordings.length;

  return (
    <AppShell
      title="Grabaciones / replay"
      description="Indice de sesiones con replay disponible. El replay es una seccion principal de la V0, no un detalle escondido."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Grabaciones disponibles" value={recordings.length} />
        <Stat label="Sesiones sin replay" value={missing} />
        <Stat label="Proveedor V0" value="PostHog" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {sessions.map((session) => (
          <article key={session.session_id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {session.recording.available ? <ReplayPreview session={session} /> : (
              <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                Sin grabacion disponible
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">Sesion {session.session_id}</p>
                <p className="mt-1 text-sm text-slate-500">Visitante {session.visitor_id} · {formatDateTime(session.timestamp)}</p>
                <p className="mt-1 text-sm text-slate-600">{humanValue(session.service)} · {session.page_path}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SourceBadge source={session.source} />
                <StatusBadge label={session.recording.available ? "Grabacion disponible" : "Sin grabacion"} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800">
                Abrir en Visitor Intelligence
              </Link>
              <Link href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=eventos`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Ver eventos
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
