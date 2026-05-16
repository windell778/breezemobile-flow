import Link from "next/link";
import type { Session } from "@/lib/data/types";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, humanValue, shortId } from "@/lib/labels";
import { mainEventLabel } from "@/lib/analytics";

type RecentSessionsProps = {
  sessions: Session[];
};

const intentBorder: Record<string, string> = {
  Alta: "border-l-emerald-500",
  Media: "border-l-amber-400",
  Baja: "border-l-slate-300",
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <div className="bf-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Sesiones recientes</h2>
        <Link href="/sesiones" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          Ver todas →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {sessions.map((session) => (
          <article
            key={session.session_id}
            className={`relative border-l-2 px-4 py-3 transition hover:bg-slate-50 ${
              intentBorder[session.intent_level] ?? "border-l-slate-200"
            }`}
          >
            {/* Stretched link — covers the full row, sits below interactive elements */}
            <Link
              href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
              aria-label={`Ver visitante ${shortId(session.visitor_id)} · sesión ${shortId(session.session_id)}`}
              className="absolute inset-0"
            />

            {/* Content — z-10 keeps it above the stretched link visually */}
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-xs font-semibold text-slate-500"
                    title={session.session_id}
                  >
                    {shortId(session.session_id)}
                  </span>
                  <span className="text-sm font-medium text-slate-950">
                    {humanValue(session.service)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <SourceBadge source={session.source} />
                  <StatusBadge label={`${session.intent_level} intención`} />
                  {session.recording?.status === "available" && (
                    // z-20 ensures Replay is clickable above the stretched link
                    <Link
                      href={`/grabaciones?session=${session.session_id}`}
                      className="relative z-20 bf-chip border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      Replay
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                {session.attribution.utm_campaign && (
                  <span>
                    Campaña:{" "}
                    <span className="text-slate-700">{session.attribution.utm_campaign}</span>
                  </span>
                )}
                <span>{session.page_path}</span>
                <span>{mainEventLabel(session)}</span>
                <span>{formatDateTime(session.timestamp)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
