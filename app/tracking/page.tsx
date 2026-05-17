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

export default async function TrackingPage() {
  const trackingHealth = await getAdapter().getTrackingHealth(DEFAULT_WORKSPACE_ID);
  const sorted = [...trackingHealth].sort(
    (a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0),
  );

  const hasHigh = sorted.some((i) => i.severity === "Alto");
  const hasMedium = sorted.some((i) => i.severity === "Medio");

  const trustStatus = hasHigh
    ? { label: "Problemas críticos detectados", bg: "var(--color-error-bg)", color: "var(--color-error-text)", border: "oklch(90% 0.03 25)" }
    : hasMedium
    ? { label: "Advertencias pendientes", bg: "var(--color-warn-bg)", color: "var(--color-warn-text)", border: "oklch(88% 0.07 75)" }
    : { label: "Tracking en buen estado", bg: "var(--color-signal-bg)", color: "var(--color-signal-text)", border: "oklch(88% 0.06 145)" };

  return (
    <AppShell
      title="Estado del tracking"
      description="Revisa si los eventos, campañas y grabaciones están llegando correctamente."
    >
      {sorted.length === 0 ? (
        <EmptyState message="No hay items de tracking health disponibles." />
      ) : (
        <>
          {/* Estado global */}
          <div
            className="mb-5 rounded-xl border px-5 py-3.5 text-sm font-medium"
            style={{ background: trustStatus.bg, color: trustStatus.color, borderColor: trustStatus.border }}
          >
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

      {/* Referencia técnica */}
      <section className="mt-6 grid gap-3 xl:grid-cols-3">
        <Panel title="Eventos recibidos">
          {eventTypes.map((eventName) => (
            <CodePill key={eventName} label={`${eventLabels[eventName]} (${eventName})`} />
          ))}
        </Panel>
        <Panel title="Servicios detectados">
          {serviceKeys.map((service) => (
            <CodePill key={service} label={`${humanValue(service)} (${service})`} />
          ))}
        </Panel>
        <Panel title="Integraciones previstas">
          {["PostHog API", "GTM/dataLayer validación", "Meta Ads API", "n8n + CAPI"].map((item) => (
            <CodePill key={item} label={item} />
          ))}
        </Panel>
      </section>

      <section
        className="mt-4 overflow-hidden rounded-xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Campos disponibles
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {trackingFields.map((field) => (
            <span
              key={field}
              className="bf-chip"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-2)",
              }}
            >
              {humanField(field)}{" "}
              <span className="font-mono" style={{ color: "var(--color-text-3)" }}>
                ({field})
              </span>
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function HealthCard({ item }: { item: TrackingHealth }) {
  const severityStyle =
    item.severity === "Alto"
      ? { bg: "var(--color-error-bg)", border: "oklch(90% 0.03 25)" }
      : item.severity === "Medio"
      ? { bg: "var(--color-warn-bg)", border: "oklch(88% 0.07 75)" }
      : { bg: "var(--color-surface)", border: "var(--color-border)" };

  return (
    <article
      className="overflow-hidden rounded-xl border p-5"
      style={{ background: severityStyle.bg, borderColor: severityStyle.border }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-3)" }}
          >
            {item.area}
          </p>
          <h2 className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
            {item.title}
          </h2>
        </div>
        <StatusBadge label={item.severity} />
      </div>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-text-2)" }}>
        {item.detail}
      </p>
      <div
        className="mt-3 rounded-lg border px-4 py-3 text-sm leading-6"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-2)" }}
      >
        <span className="font-medium" style={{ color: "var(--color-text-1)" }}>
          Recomendación:{" "}
        </span>
        {item.recommendation}
      </div>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-xl border p-5"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
        {title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CodePill({ label }: { label: string }) {
  return (
    <span
      className="bf-chip"
      style={{
        background: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-2)",
      }}
    >
      {label}
    </span>
  );
}
