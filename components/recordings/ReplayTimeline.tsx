"use client";

import type { TrackingEvent } from "@/lib/data/types";
import { eventLabels, serviceLabels } from "@/lib/labels";

type Props = {
  events: TrackingEvent[];
  sessionStartedAt: string;
  /**
   * When provided, each event row becomes clickable.
   * Called with the seek position in ms already adjusted by a 2s safety margin
   * (i.e. offset − 2000ms, min 0) so the player shows context before the event fires.
   * See docs/architecture/recordings.md §11 — timestamp alignment caveats.
   */
  onSeek?: (seekMs: number) => void;
};

const eventColors: Record<string, string> = {
  whatsapp_click: "bg-emerald-500",
  service_click: "bg-blue-500",
  page_view_custom: "bg-zinc-500",
};

const eventDot: Record<string, string> = {
  whatsapp_click: "ring-emerald-500/30",
  service_click: "ring-blue-500/30",
  page_view_custom: "ring-zinc-500/30",
};

function secondsOffset(start: string, ts: string): number {
  return Math.max(0, (new Date(ts).getTime() - new Date(start).getTime()) / 1000);
}

function formatOffset(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReplayTimeline({ events, sessionStartedAt, onSeek }: Props) {
  if (!events.length) {
    return (
      <p className="text-sm text-zinc-500">Sin eventos registrados para esta sesión.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-1">
      {events.map((event, idx) => {
        const offset = secondsOffset(sessionStartedAt, event.timestamp);
        const offsetMs = offset * 1000;
        const color = eventColors[event.event_name] ?? "bg-zinc-500";
        const ring = eventDot[event.event_name] ?? "ring-zinc-500/30";

        const inner = (
          <>
            {/* Time marker */}
            <span className="w-10 shrink-0 pt-0.5 text-right text-xs tabular-nums text-zinc-500">
              {formatOffset(offset)}
            </span>

            {/* Dot */}
            <span
              className={`mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ${color} ${ring}`}
            />

            {/* Event detail */}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-zinc-200">
                {eventLabels[event.event_name]}
              </span>
              {event.cta_text && (
                <span className="text-xs text-zinc-400">&ldquo;{event.cta_text}&rdquo;</span>
              )}
              {event.service && event.service !== "general" && (
                <span className="text-xs text-zinc-500">
                  {serviceLabels[event.service]}
                </span>
              )}
            </div>
          </>
        );

        // 2s safety margin so the player shows context before the event fires.
        // See docs/architecture/recordings.md §11 for timestamp alignment caveats.
        const seekMs = Math.max(0, offsetMs - 2000);

        return onSeek ? (
          <li key={event.event_id || idx}>
            <button
              type="button"
              onClick={() => onSeek(seekMs)}
              className="flex w-full items-start gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white/5 active:bg-white/10"
              title="Saltar al replay en este momento (aproximado)"
            >
              {inner}
            </button>
          </li>
        ) : (
          <li key={event.event_id || idx} className="flex items-start gap-3 px-2 py-1.5">
            {inner}
          </li>
        );
      })}
    </ol>
  );
}
