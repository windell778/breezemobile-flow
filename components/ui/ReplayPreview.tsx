import type { Session } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/labels";

type ReplayPreviewProps = {
  session: Session;
};

export function ReplayPreview({ session }: ReplayPreviewProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
      <div className="flex aspect-video items-center justify-center rounded-md border border-white/10 bg-[linear-gradient(135deg,#111827,#0f766e)]">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-lg font-semibold text-slate-950">▶</div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold">Replay interno</p>
          <p className="mt-1 text-slate-300">Sesion {session.session_id} · {session.duration}</p>
        </div>
        <p className="text-right text-xs text-slate-400">{formatDateTime(session.timestamp)}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-2 w-2/5 rounded-full bg-cyan-300" />
      </div>
    </div>
  );
}
