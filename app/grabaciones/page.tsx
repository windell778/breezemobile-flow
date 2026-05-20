export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterBar";
import { StatTile } from "@/components/ui/Panel";
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
  const scopedSessions = await getAdapter().listSessions(
    DEFAULT_WORKSPACE_ID,
    p.service ? { service: p.service as ServiceKey } : undefined,
  );

  if (scopedSessions.length === 0) {
    return (
      <EmptyState
        title="No hay sesiones para reproducir"
        message={
          p.service
            ? `No hay sesiones para el servicio ${humanValue(p.service)}.`
            : "Todavía no hay sesiones disponibles para revisar."
        }
      />
    );
  }

  const activeSession =
    scopedSessions.find((session) => session.session_id === p.selectedSessionId) ||
    scopedSessions.find((session) => session.recording?.status === "available") ||
    scopedSessions[0];

  const recordings = scopedSessions.filter((session) => session.recording?.status === "available");
  const missing = scopedSessions.length - recordings.length;

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3">
        <StatTile label="Grabaciones disponibles" value={recordings.length} />
        <StatTile label="Sesiones sin grabación" value={missing} />
        <StatTile label="Fuente de grabaciones" value="PostHog" />
      </section>

      <GrabacionesReplaySection
        activeSession={activeSession}
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
          <div key={i} className="bf-panel animate-pulse p-4">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <section className="bf-defer mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video rounded-lg bg-slate-200" />
          <div className="bf-panel h-32 bg-slate-50 p-4" />
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-slate-200 bg-slate-100" />
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
          <FilterChip href="/grabaciones" tone="warning">
            Servicio: {humanValue(service)} ×
          </FilterChip>
        </div>
      ) : null}

      <Suspense fallback={<GrabacionesLoading />}>
        <GrabacionesContent p={{ service, selectedSessionId }} />
      </Suspense>
    </AppShell>
  );
}
