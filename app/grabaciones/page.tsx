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
      {/* Stats compactas */}
      <section
        className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border"
        style={{ background: "var(--color-border)", borderColor: "var(--color-border)" }}
      >
        {[
          { label: "Grabaciones disponibles", value: recordings.length },
          { label: "Sin grabación", value: missing },
          { label: "Fuente", value: "PostHog" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col px-5 py-3"
            style={{ background: "var(--color-surface)" }}
          >
            <span className="text-[10px] font-medium" style={{ color: "var(--color-text-3)" }}>
              {label}
            </span>
            <span className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-1)" }}>
              {value}
            </span>
          </div>
        ))}
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
      <section
        className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border"
        style={{ background: "var(--color-border)" }}
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col px-5 py-3" style={{ background: "var(--color-surface)" }}>
            <div className="h-2.5 w-28 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
            <div className="mt-2 h-7 w-10 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
          </div>
        ))}
      </section>
      <section className="bf-defer mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_390px]">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video rounded-xl" style={{ background: "var(--color-surface-2)" }} />
          <div className="h-32 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-2)" }} />
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
      {service && (
        <div className="mb-4">
          <Link
            href="/grabaciones"
            className="bf-chip transition-colors"
            style={{
              borderColor: "oklch(88% 0.07 75)",
              background: "var(--color-warn-bg)",
              color: "var(--color-warn-text)",
            }}
          >
            Servicio: {humanValue(service)} ×
          </Link>
        </div>
      )}

      <Suspense fallback={<GrabacionesLoading />}>
        <GrabacionesContent p={{ service, selectedSessionId }} />
      </Suspense>
    </AppShell>
  );
}
