"use client";

import type { TrackingEvent } from "@/lib/data/types";
import { eventLabels, serviceLabels } from "@/lib/labels";

type Props = {
  events: TrackingEvent[];
  sessionStartedAt: string;
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

export function ReplayTimeline({ events, sessionStartedAt }: Props) {
  if (!events.length) {
    return (
      <p className="text-sm text-zinc-500">Sin eventos registrados para esta sesión.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event, idx) => {
        const offset = secondsOffset(sessionStartedAt, event.timestamp);
        const color = eventColors[event.event_name] ?? "bg-zinc-500";
        const ring = eventDot[event.event_name] ?? "ring-zinc-500/30";

        return (
          <li key={event.event_id || idx} className="flex items-start gap-3">
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
          </li>
        );
      })}
    </ol>
  );
}
