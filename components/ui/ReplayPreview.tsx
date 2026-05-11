import type { Session } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/labels";

type ReplayPreviewProps = {
  session: Session;
};

export function ReplayPreview({ session }: ReplayPreviewProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white shadow-[0_1px_0_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs">
        <p className="font-semibold">Replay interno</p>
        <p className="text-slate-400">{formatDateTime(session.timestamp)}</p>
      </div>
      <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#111827,#0f172a_45%,#1d4ed8)]">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-sm font-semibold text-slate-950">Play</div>
      </div>
      <div className="px-4 py-4 text-sm">
        <p className="font-semibold">Sesion {session.session_id}</p>
        <p className="mt-1 text-slate-300">{session.duration}</p>
        <div className="mt-3 h-1.5 rounded-full bg-white/10">
          <div className="h-1.5 w-2/5 rounded-full bg-blue-300" />
        </div>
      </div>
    </div>
  );
}
