"use client";

import "rrweb-player/dist/style.css";
import { useEffect, useRef, useState } from "react";
import type { eventWithTime } from "@rrweb/types";

type Props = {
  recordingId: string;
};

const CONTROLLER_HEIGHT = 80;

export function RRWebPlayer({ recordingId }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  // 0 = not yet measured by ResizeObserver; player init waits for a real value
  const [playerWidth, setPlayerWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setPlayerWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playerWidth || !containerRef.current) return;

    const w = playerWidth;
    const h = Math.floor(w * 9 / 16);

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let playerInstance: any = null;

    async function init() {
      try {
        const [{ default: rrwebPlayer }, eventsRes] = await Promise.all([
          import("rrweb-player"),
          fetch(`/api/recordings/${recordingId}/snapshots`),
        ]);

        if (destroyed) return;

        if (!eventsRes.ok) {
          const body = await eventsRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${eventsRes.status}`);
        }

        const { events } = (await eventsRes.json()) as { events: eventWithTime[] };

        if (destroyed) return;

        if (!events?.length) {
          throw new Error("Sin eventos de grabación disponibles.");
        }

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        playerInstance = new rrwebPlayer({
          target: containerRef.current,
          props: { events, width: w, height: h, autoPlay: true, showController: true },
        });

        setStatus("ready");
      } catch (err) {
        if (!destroyed) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    void init();

    return () => {
      destroyed = true;
      playerInstance?.pause?.();
    };
  }, [recordingId, playerWidth]);

  const h = playerWidth ? Math.floor(playerWidth * 9 / 16) : 450;

  if (status === "error") {
    return (
      <div className="grid aspect-video place-items-center rounded-md border border-dashed border-red-200 bg-red-50 text-sm text-red-600">
        {errorMsg || "No se pudo cargar la grabación."}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative overflow-hidden rounded-md border border-slate-800 bg-slate-950">
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
          Cargando grabación...
        </div>
      )}
      <div
        ref={containerRef}
        className="mx-auto"
        style={{ width: playerWidth || "100%", minHeight: h + CONTROLLER_HEIGHT }}
      />
    </div>
  );
}
