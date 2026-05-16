"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Session } from "@/lib/data/types";
import { RRWebPlayer, type RRWebPlayerHandle } from "@/components/ui/RRWebPlayer";
import { ReplayTimeline } from "@/components/recordings/ReplayTimeline";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatDuration, humanValue, shortId } from "@/lib/labels";
import { mainEventLabel } from "@/lib/analytics";

type Props = {
  activeSession: Session;
  scopedSessions: Session[];
  service: string;
};

export function GrabacionesReplaySection({ activeSession, scopedSessions, service }: Props) {
  const playerRef = useRef<RRWebPlayerHandle>(null);

  const recordingId = activeSession.recording?.recording_id;
  const hasRecording = activeSession.recording?.status === "available" && !!recordingId;

  function handleSeek(seekMs: number) {
    // seekMs already has the 2s safety margin applied by ReplayTimeline.
    playerRef.current?.seekTo(seekMs);
  }

  return (
    <section className="bf-defer mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
      {/* Left: player + session info bar */}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white shadow-[0_1px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs">
            <p className="font-semibold">Grabación</p>
            <p className="text-slate-400">{formatDateTime(activeSession.timestamp)}</p>
          </div>
          {hasRecording ? (
            <RRWebPlayer ref={playerRef} recordingId={recordingId} />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#111827,#0f172a_45%,#1d4ed8)]">
              <p className="text-sm text-slate-400">Sin grabación disponible</p>
            </div>
          )}
        </div>

        <div className="bf-panel flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 text-sm">
          <span className="font-mono font-semibold text-slate-950" title={activeSession.session_id}>
            {shortId(activeSession.session_id)}
          </span>
          <span className="text-slate-500">{formatDateTime(activeSession.timestamp)}</span>
          <span className="text-slate-600">{humanValue(activeSession.service)} · {activeSession.page_path}</span>
          <span className="text-slate-500">{formatDuration(activeSession.duration)}</span>
          <div className="flex flex-wrap gap-2">
            <SourceBadge source={activeSession.source} />
            <StatusBadge label={mainEventLabel(activeSession)} />
          </div>
          {activeSession.attribution.utm_campaign ? (
            <span className="text-slate-500">Campaña: {activeSession.attribution.utm_campaign}</span>
          ) : null}
        </div>
      </div>

      {/* Right: event timeline + session list */}
      <aside className="space-y-4">
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white">
          <div className="border-b border-white/10 px-3 py-2">
            <h2 className="text-base font-semibold text-white">Eventos</h2>
            <p className="mt-1 text-xs text-slate-400">
              {hasRecording
                ? "Haz clic para saltar a ese momento de la grabación."
                : "Eventos registrados en esta sesión."}
            </p>
          </div>
          <div className="p-3">
            <ReplayTimeline
              events={activeSession.events}
              sessionStartedAt={activeSession.timestamp}
              onSeek={hasRecording ? handleSeek : undefined}
            />
          </div>
        </div>

        <div className="bf-panel p-3">
          <h2 className="text-base font-semibold text-slate-950">Sesiones con contexto</h2>
          <div className="mt-4 space-y-2">
            {scopedSessions.map((session) => (
              <Link
                key={session.session_id}
                href={`/grabaciones?session=${session.session_id}${service ? `&service=${service}` : ""}`}
                className={`block rounded-md border p-2.5 text-sm ${
                  session.session_id === activeSession.session_id
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono font-semibold text-slate-950" title={session.session_id}>
                    {shortId(session.session_id)}
                  </p>
                  <span className="text-xs text-slate-500">{formatDuration(session.duration)}</span>
                </div>
                <p className="mt-1 text-slate-600">{humanValue(session.service)} - {session.source}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {session.recording?.status === "available" ? "Con grabación" : "Sin grabación"} · {session.events.length} eventos
                </p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
