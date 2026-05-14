"use client";

import "rrweb-player/dist/style.css";
import { useEffect, useRef, useState } from "react";

type Props = {
  recordingId: string;
  width?: number;
  height?: number;
};

export function RRWebPlayer({ recordingId, width = 800, height = 450 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

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

        const { events } = (await eventsRes.json()) as { events: unknown[] };

        if (destroyed) return;

        if (!events?.length) {
          throw new Error("Sin eventos de grabación disponibles.");
        }

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        playerInstance = new rrwebPlayer({
          target: containerRef.current,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props: { events: events as any[], width, height, autoPlay: true, showController: true },
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
  }, [recordingId, width, height]);

  if (status === "error") {
    return (
      <div className="grid aspect-video place-items-center rounded-md border border-dashed border-red-200 bg-red-50 text-sm text-red-600">
        {errorMsg || "No se pudo cargar la grabación."}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-800 bg-slate-950">
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
          Cargando grabación...
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", minHeight: height }} />
    </div>
  );
}
