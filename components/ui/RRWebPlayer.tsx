"use client";

import "rrweb-player/dist/style.css";
import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  recordingId: string;
  width?: number;
  height?: number;
};

type SnapshotResponse = {
  events: unknown[];
  windows: string[];
  currentWindow: string | null;
};

export function RRWebPlayer({ recordingId, width = 800, height = 450 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [windows, setWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const loadWindow = useCallback(
    async (windowId: string | null) => {
      if (!containerRef.current) return;
      setStatus("loading");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let playerInstance: any = null;
      let destroyed = false;

      try {
        const url = windowId
          ? `/api/recordings/${recordingId}/snapshots?windowId=${encodeURIComponent(windowId)}`
          : `/api/recordings/${recordingId}/snapshots`;

        const [{ default: rrwebPlayer }, eventsRes] = await Promise.all([
          import("rrweb-player"),
          fetch(url),
        ]);

        if (destroyed) return;

        if (!eventsRes.ok) {
          const body = await eventsRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${eventsRes.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await eventsRes.json()) as SnapshotResponse;

        if (destroyed) return;

        if (!data.events?.length) {
          throw new Error("Sin eventos de grabación disponibles.");
        }

        setWindows(data.windows ?? []);
        setActiveWindow(data.currentWindow);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        playerInstance = new rrwebPlayer({
          target: containerRef.current,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props: { events: data.events as any[], width, height, autoPlay: true, showController: true },
        });

        setStatus("ready");
      } catch (err) {
        if (!destroyed) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }

      return () => {
        destroyed = true;
        playerInstance?.pause?.();
      };
    },
    [recordingId, width, height],
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void loadWindow(null).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, [loadWindow]);

  if (status === "error") {
    return (
      <div className="grid aspect-video place-items-center rounded-md border border-dashed border-red-200 bg-red-50 text-sm text-red-600">
        {errorMsg || "No se pudo cargar la grabación."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950">
      {windows.length > 1 && (
        <div className="flex gap-1 border-b border-slate-800 px-3 py-2">
          {windows.map((wid, i) => (
            <button
              key={wid}
              onClick={() => void loadWindow(wid)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                wid === activeWindow
                  ? "bg-slate-600 text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Ventana {i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        {status === "loading" && (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
            Cargando grabación...
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", minHeight: height }} />
      </div>
    </div>
  );
}
