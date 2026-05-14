export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import type { Session } from "@/lib/data/types";
import { eventLabels, formatDateTime, formatDuration, humanValue, shortId } from "@/lib/labels";
import { mainEventLabel } from "@/lib/analytics";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type GrabacionesParams = {
  service: string;
  selectedSessionId: string;
};

async function GrabacionesContent({ p }: { p: GrabacionesParams }) {
  const allSessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID);
  const scopedSessions = p.service ? allSessions.filter((s) => s.service === p.service) : allSessions;

  const activeSession =
    scopedSessions.find((s) => s.session_id === p.selectedSessionId) ||
    scopedSessions.find((s) => s.recording?.status === "available") ||
    scopedSessions[0] ||
    allSessions[0];

  const recordings = allSessions.filter((s) => s.recording?.status === "available");
  const missing = allSessions.length - recordings.length;

  if (!activeSession) {
    return <EmptyState message="No hay sesiones disponibles." />;
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Grabaciones disponibles" value={recordings.length} />
        <Stat label="Sesiones sin replay" value={missing} />
        <Stat label="Proveedor V0" value="PostHog" />
      </section>

      <section className="bf-defer mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
        <div className="space-y-4">
          {activeSession.recording?.status === "available" ? (
            <ReplayPreview session={activeSession} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              La sesion seleccionada no tiene grabacion disponible.
            </div>
          )}

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

        <aside className="space-y-4">
          <EventFeed session={activeSession} />
          <div className="bf-panel p-3">
            <h2 className="text-base font-semibold text-slate-950">Sesiones con contexto</h2>
            <div className="mt-4 space-y-2">
              {scopedSessions.map((session) => (
                <Link
                  key={session.session_id}
                  href={`/grabaciones?session=${session.session_id}${p.service ? `&service=${p.service}` : ""}`}
                  className={`block rounded-md border p-2.5 text-sm ${
                    session.session_id === activeSession.session_id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-semibold text-slate-950" title={session.session_id}>{shortId(session.session_id)}</p>
                    <span className="text-xs text-slate-500">{formatDuration(session.duration)}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{humanValue(session.service)} - {session.source}</p>
                  <p className="mt-1 text-xs text-slate-500">{session.recording?.status === "available" ? "Con replay" : "Sin replay"} - {session.events.length} eventos</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

function GrabacionesLoading() {
  return (
    <>
      <section className="grid gap-3 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bf-panel animate-pulse p-3">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <section className="bf-defer mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video rounded-md bg-slate-200" />
          <div className="bf-panel h-32 bg-slate-50 p-4" />
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-md border border-slate-200 bg-slate-100" />
          ))}
        </div>
      </section>
    </>
  );
}

export default async function GrabacionesPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const service = String(params.service || "");
  const selectedSessionId = String(params.session || "");

  return (
    <AppShell
      title="Grabaciones / replay"
      description="Replay de sesiones reales desde PostHog. Selecciona una sesión de la lista para reproducir su grabación de comportamiento."
    >
      {service ? (
        <div className="mb-4">
          <Link href="/grabaciones" className="bf-chip border-amber-200 bg-amber-50 text-amber-800">
            Servicio: {humanValue(service)} x
          </Link>
        </div>
      ) : null}

      <Suspense fallback={<GrabacionesLoading />}>
        <GrabacionesContent p={{ service, selectedSessionId }} />
      </Suspense>
    </AppShell>
  );
}

function EventFeed({ session }: { session: Session }) {
  return (
    <div className="bf-panel overflow-hidden">
      <div className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-base font-semibold text-slate-950">Feed de eventos</h2>
        <p className="mt-1 text-xs text-slate-500">Eventos visibles mientras se revisa el replay.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {session.events.map((event, index) => (
          <div key={event.event_id} className="grid grid-cols-[32px_1fr] gap-3 p-3 text-sm">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-800">{index + 1}</div>
            <div>
              <p className="font-medium text-slate-950">{eventLabels[event.event_name]}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
              <p className="mt-2 text-slate-600">{event.cta_text || event.page_path}</p>
              {event.cta_location ? <p className="mt-1 text-xs text-slate-500">Ubicacion: {event.cta_location}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

