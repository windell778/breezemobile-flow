import Link from "next/link";
import type { Session } from "@/lib/data/types";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateTime, humanValue, shortId } from "@/lib/labels";
import { mainEventLabel } from "@/lib/analytics";

type RecentSessionsProps = {
  sessions: Session[];
};

const intentTone: Record<string, string> = {
  Alta: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Media: "bg-amber-50 text-amber-700 ring-amber-100",
  Baja: "bg-slate-50 text-slate-600 ring-slate-200",
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <div className="bf-apple-table">
      <div className="flex items-center justify-between border-b border-[var(--apple-separator)] bg-[rgba(248,248,250,0.58)] px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Sesiones recientes</h2>
        <Link href="/sesiones" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          Ver todas
        </Link>
      </div>
      <div className="bf-premium-table-body">
        {sessions.map((session) => (
          <article
            key={session.session_id}
            className="bf-apple-row relative px-4 py-3"
          >
            <Link
              href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
              aria-label={`Ver visitante ${shortId(session.visitor_id)}, sesión ${shortId(session.session_id)}`}
              className="absolute inset-0 z-10"
            />

            <div className="pointer-events-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="bf-apple-pill font-mono"
                    title={session.session_id}
                  >
                    {shortId(session.session_id)}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-950">
                    {humanValue(session.service)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <SourceBadge source={session.source} />
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold leading-none ring-1 ${
                      intentTone[session.intent_level] ?? intentTone.Baja
                    }`}
                  >
                    {session.intent_level} intención
                  </span>
                  {session.recording?.status === "available" ? (
                    <Link
                      href={`/grabaciones?session=${session.session_id}`}
                      className="bf-apple-action pointer-events-auto relative z-20 min-h-8 text-[11px]"
                    >
                      Ver grabación
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                {session.attribution.utm_campaign ? (
                  <span>
                    Campaña:{" "}
                    <span className="text-slate-700">{session.attribution.utm_campaign}</span>
                  </span>
                ) : null}
                <span className="font-mono">{session.page_path}</span>
                <span>{mainEventLabel(session)}</span>
                <span className="font-mono">{formatDateTime(session.timestamp)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
