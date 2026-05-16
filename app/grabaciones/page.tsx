export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { GrabacionesReplaySection } from "@/components/recordings/GrabacionesReplaySection";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { humanValue } from "@/lib/labels";
import type { ServiceKey } from "@/lib/data/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type GrabacionesParams = {
  service: string;
  selectedSessionId: string;
};

async function GrabacionesContent({ p }: { p: GrabacionesParams }) {
  // Use adapter-level filter so service scope matches /sesiones and /servicios:
  // includes sessions whose primary service OR any event service matches.
  const scopedSessions = await getAdapter().listSessions(
    DEFAULT_WORKSPACE_ID,
    p.service ? { service: p.service as ServiceKey } : undefined,
  );

  if (scopedSessions.length === 0) {
    return (
      <EmptyState
        message={
          p.service
            ? `No hay sesiones para el servicio ${humanValue(p.service)}.`
            : "No hay sesiones disponibles."
        }
      />
    );
  }

  const activeSession =
    scopedSessions.find((s) => s.session_id === p.selectedSessionId) ||
    scopedSessions.find((s) => s.recording?.status === "available") ||
    scopedSessions[0];

  const recordings = scopedSessions.filter((s) => s.recording?.status === "available");
  const missing = scopedSessions.length - recordings.length;

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Grabaciones disponibles" value={recordings.length} />
        <Stat label="Sesiones sin grabación" value={missing} />
        <Stat label="Fuente de grabaciones" value="PostHog" />
      </section>

      <GrabacionesReplaySection
        activeSession={activeSession!}
        scopedSessions={scopedSessions}
        service={p.service}
      />
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
      title="Grabaciones"
      description="Reproduce sesiones reales y revisa qué hizo el visitante durante la visita."
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


function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

