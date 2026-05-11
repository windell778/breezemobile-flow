import type { Session } from "@/lib/mock-data";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentSessionsProps = {
  sessions: Session[];
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f162a]/85 p-5">
      <h2 className="text-lg font-semibold text-white">Sesiones recientes</h2>
      <div className="mt-4 space-y-3">
        {sessions.map((session) => (
          <article key={session.sessionId} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">{session.service}</p>
              <div className="flex items-center gap-2">
                <SourceBadge source={session.source} />
                <StatusBadge label={`${session.intentLevel} intención`} />
                <StatusBadge label={session.hasReplay ? "Replay disponible" : "Sin replay"} />
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
              <p>Campaña: <span className="text-slate-100">{session.campaign}</span></p>
              <p>Página: <span className="text-slate-100">{session.page}</span></p>
              <p>Último evento: <span className="text-slate-100">{session.event}</span></p>
              <p>Duración: <span className="text-slate-100">{session.duration}</span></p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
