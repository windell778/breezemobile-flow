export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { humanValue } from "@/lib/labels";
import type { ServicePageSummary } from "@/lib/data/types";

export default async function ServiciosPage() {
  const servicePageSummaries = await getAdapter().getServiceSummaries(DEFAULT_WORKSPACE_ID);

  return (
    <AppShell
      title="Servicios"
      description="Compara qué servicios reciben más visitas, clicks internos y clicks a WhatsApp."
    >
      {servicePageSummaries.length === 0 ? (
        <EmptyState message="No hay datos de servicios disponibles." />
      ) : (
        <section className="bf-defer grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {servicePageSummaries.map((page) => (
            <ServiceCard key={page.path} page={page} />
          ))}
        </section>
      )}
    </AppShell>
  );
}

function ServiceCard({ page }: { page: ServicePageSummary }) {
  const totalSignal = page.service_clicks + page.whatsapp_clicks;
  const conversionRate =
    page.sessions > 0 ? Math.round((page.whatsapp_clicks / page.sessions) * 100) : 0;

  return (
    <article
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Header */}
      <div
        className="border-b px-5 py-4"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold" style={{ color: "var(--color-text-1)" }}>
            {humanValue(page.service)}
          </h2>
          <span className="font-mono text-xs" style={{ color: "var(--color-text-3)" }}>
            {page.path}
          </span>
        </div>
        {/* Mini funnel */}
        <div className="mt-4 space-y-2">
          <FunnelBar label="Sesiones" value={page.sessions} max={page.sessions} color="var(--color-border-2)" />
          <FunnelBar label="Clicks servicios" value={page.service_clicks} max={page.sessions} color="var(--color-primary)" />
          <FunnelBar label="WhatsApp" value={page.whatsapp_clicks} max={page.sessions} color="var(--color-signal)" />
        </div>
      </div>

      {/* Métricas */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Sesiones" value={page.sessions} />
          <Metric label="Vistas de página" value={page.page_views} />
          <Metric label="Clicks en servicios" value={page.service_clicks} />
          <Metric label="WhatsApp clicks" value={page.whatsapp_clicks} highlight />
        </div>

        <div
          className="mt-3 flex items-center justify-between text-xs"
          style={{ color: "var(--color-text-3)" }}
        >
          <span>
            Clicks totales:{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-2)" }}>
              {totalSignal}
            </span>
          </span>
          <span>
            % WA:{" "}
            <span className="font-semibold" style={{ color: "var(--color-signal-text)" }}>
              {conversionRate}%
            </span>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/sesiones?service=${page.service}`}
            className="bf-control text-white transition-colors hover:opacity-90"
            style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          >
            Ver sesiones
          </Link>
          <Link
            href={`/grabaciones?service=${page.service}`}
            className="bf-control transition-colors hover:bg-[var(--color-surface-2)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-1)" }}
          >
            Ver grabaciones
          </Link>
        </div>
      </div>
    </article>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px]" style={{ color: "var(--color-text-3)" }}>
        {label}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full"
        style={{ height: 5, background: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="w-6 text-right text-[11px] font-semibold"
        style={{ color: "var(--color-text-2)" }}
      >
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: highlight ? "var(--color-signal-text)" : "var(--color-text-1)" }}
      >
        {value}
      </p>
    </div>
  );
}
