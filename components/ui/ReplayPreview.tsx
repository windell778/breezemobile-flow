import type { Session } from "@/lib/data/types";
import { formatDateTime } from "@/lib/labels";
import { RRWebPlayer } from "@/components/ui/RRWebPlayer";

type ReplayPreviewProps = {
  session: Session;
};

export function ReplayPreview({ session }: ReplayPreviewProps) {
  const recordingId = session.recording?.recording_id;
  const hasRecording = session.recording?.status === "available" && recordingId;

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white shadow-[0_1px_0_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs">
        <p className="font-semibold">Grabación</p>
        <p className="text-slate-400">{formatDateTime(session.timestamp)}</p>
      </div>

      {hasRecording ? (
        <RRWebPlayer recordingId={recordingId} />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#111827,#0f172a_45%,#1d4ed8)]">
          <p className="text-sm text-slate-400">Sin grabación disponible</p>
        </div>
      )}
    </div>
  );
}
