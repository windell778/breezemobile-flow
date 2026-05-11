import type { Session } from "@/lib/mock-data";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, humanValue } from "@/lib/labels";
import { mainEventLabel } from "@/lib/analytics";

type RecentSessionsProps = {
  sessions: Session[];
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Sesiones recientes</h2>
      <div className="mt-4 space-y-3">
        {sessions.map((session) => (
          <article key={session.session_id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-950">{humanValue(session.service)}</p>
              <div className="flex items-center gap-2">
                <SourceBadge source={session.source} />
                <StatusBadge label={`${session.intent_level} intencion`} />
                <StatusBadge label={session.recording.available ? "Replay disponible" : "Sin replay"} />
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
              <p>Campana: <span className="text-slate-950">{session.attribution.utm_campaign || "Sin campana"}</span></p>
              <p>Pagina: <span className="text-slate-950">{session.page_path}</span></p>
              <p>Evento: <span className="text-slate-950">{mainEventLabel(session)}</span></p>
              <p>Hora: <span className="text-slate-950">{formatDateTime(session.timestamp)}</span></p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
