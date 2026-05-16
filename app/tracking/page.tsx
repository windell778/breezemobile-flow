export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { eventTypes, serviceKeys, trackingFields } from "@/lib/mock-data";
import { eventLabels, humanField, humanValue } from "@/lib/labels";
import type { ReactNode } from "react";
import type { TrackingHealth } from "@/lib/data/types";

const severityOrder: Record<string, number> = { Alto: 3, Medio: 2, Bajo: 1 };

const severityBar: Record<string, string> = {
  Alto: "border-l-red-500",
  Medio: "border-l-amber-400",
  Bajo: "border-l-slate-300",
};

export default async function TrackingPage() {
  const trackingHealth = await getAdapter().getTrackingHealth(DEFAULT_WORKSPACE_ID);
  const sorted = [...trackingHealth].sort(
    (a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0)
  );

  const hasHigh = sorted.some((i) => i.severity === "Alto");
  const hasMedium = sorted.some((i) => i.severity === "Medio");
  const trustStatus = hasHigh
    ? { label: "Problemas críticos detectados", cls: "border-red-200 bg-red-50 text-red-800" }
    : hasMedium
    ? { label: "Advertencias pendientes", cls: "border-amber-200 bg-amber-50 text-amber-800" }
    : { label: "Tracking en buen estado", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" };

  return (
    <AppShell
      title="Tracking Health"
      description="Trust Layer: validación del contrato de datos. Cada problema aquí afecta la confiabilidad de las métricas de la plataforma."
    >
      {sorted.length === 0 ? (
        <EmptyState message="No hay items de tracking health disponibles." />
      ) : (
        <>
          {/* Overall trust status */}
          <div className={`mb-5 rounded-md border px-4 py-3 text-sm font-medium ${trustStatus.cls}`}>
            {trustStatus.label} · {sorted.length} item{sorted.length !== 1 ? "s" : ""} monitoreado{sorted.length !== 1 ? "s" : ""}
          </div>

          {/* Health items */}
          <section className="space-y-3">
            {sorted.map((item) => (
              <HealthCard key={item.id} item={item} />
            ))}
          </section>
        </>
      )}

      {/* Technical reference */}
      <section className="mt-6 grid gap-3 xl:grid-cols-3">
        <Panel title="Eventos dataLayer / PostHog">
          {eventTypes.map((eventName) => (
            <CodePill key={eventName} label={`${eventLabels[eventName]} (${eventName})`} />
          ))}
        </Panel>
        <Panel title="Servicios detectados">
          {serviceKeys.map((service) => (
            <CodePill key={service} label={`${humanValue(service)} (${service})`} />
          ))}
        </Panel>
        <Panel title="Fuentes futuras">
          {["PostHog API", "GTM/dataLayer validación", "Meta Ads API", "n8n + CAPI"].map((item) => (
            <CodePill key={item} label={item} />
          ))}
        </Panel>
      </section>

      <section className="bf-panel mt-4 p-4">
        <h2 className="text-base font-semibold text-slate-950">Campos disponibles</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {trackingFields.map((field) => (
            <span key={field} className="bf-chip bg-slate-50 text-slate-600">
              {humanField(field)}{" "}
              <span className="font-mono text-slate-400">({field})</span>
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function HealthCard({ item }: { item: TrackingHealth }) {
  return (
    <article className={`bf-panel border-l-2 p-4 ${severityBar[item.severity] ?? "border-l-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {item.area}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">{item.title}</h2>
        </div>
        <StatusBadge label={item.severity} />
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-600">
        <span className="font-medium text-slate-700">Recomendación: </span>
        {item.recommendation}
      </div>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bf-panel p-4">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CodePill({ label }: { label: string }) {
  return <span className="bf-chip bg-slate-50 text-slate-600">{label}</span>;
}
