"use client";

// rrweb-player is a vanilla JS / Svelte player.
// We mount it imperatively inside a useEffect to avoid SSR issues.
// The component is wrapped with dynamic({ ssr: false }) at the page level.

import { useEffect, useRef, useState } from "react";
import { RecordingStatus } from "@/components/recordings/RecordingStatus";

type RRWebEvent = {
  type: number;
  data: unknown;
  timestamp: number;
};

type Props = {
  recordingId: string;
  events?: RRWebEvent[];       // pre-loaded events (e.g. from mock)
  streamUrl?: string | null;   // signed R2 URL to fetch events from
  width?: number;
  height?: number;
  autoPlay?: boolean;
  speed?: number;
};

export function ReplayPlayer({
  recordingId,
  events: initialEvents,
  streamUrl,
  width = 800,
  height = 450,
  autoPlay = false,
  speed = 1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // rrweb-player types don't declare $destroy; cast to access the Svelte lifecycle method.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let events = initialEvents;

      // If no events provided, fetch from signed URL.
      if (!events && streamUrl) {
        try {
          const res = await fetch(streamUrl);
          if (!res.ok) throw new Error(`Failed to load recording: ${res.status}`);
          events = (await res.json()) as RRWebEvent[];
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar grabación");
          return;
        }
      }

      // If still no events, fetch signed URL from our API.
      if (!events && !streamUrl) {
        try {
          const res = await fetch(`/api/recordings/${recordingId}/stream-url`);
          const json = (await res.json()) as { url?: string; error?: string };
          if (!json.url) throw new Error(json.error ?? "URL no disponible");

          const eventsRes = await fetch(json.url);
          if (!eventsRes.ok) throw new Error("Error al descargar grabación");
          events = (await eventsRes.json()) as RRWebEvent[];
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar grabación");
          return;
        }
      }

      if (!events?.length) {
        if (!cancelled) setError("La grabación no contiene eventos.");
        return;
      }

      if (cancelled || !containerRef.current) return;

      setLoading(false);

      // Dynamic import to avoid SSR bundle issues.
      const rrwebPlayerModule = await import("rrweb-player");
      if (cancelled || !containerRef.current) return;

      const RRWebPlayer = rrwebPlayerModule.default;

      playerRef.current = new RRWebPlayer({
        target: containerRef.current,
        props: {
          events,
          width,
          height,
          autoPlay,
          speed,
          showController: true,
          skipInactive: true,
        },
      });
    }

    void init();

    return () => {
      cancelled = true;
      playerRef.current?.$destroy();
      playerRef.current = null;
    };
  }, [recordingId, initialEvents, streamUrl, width, height, autoPlay, speed]);

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-center"
        style={{ width, height }}
      >
        <RecordingStatus status="missing" />
        <p className="mt-2 text-xs text-zinc-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50"
        >
          <RecordingStatus status="processing" />
        </div>
      )}
      <div ref={containerRef} className={loading ? "invisible" : undefined} />
    </div>
  );
}
