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
      description="Señal de intención por servicio: visitas, interés declarado y clicks en WhatsApp."
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
    <article className="bf-panel overflow-hidden">
      {/* Signal funnel bar */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-950">{humanValue(page.service)}</h2>
          <span className="font-mono text-xs text-slate-400">{page.path}</span>
        </div>
        {/* Mini funnel: sessions → service clicks → WA clicks */}
        <div className="mt-3 space-y-1.5">
          <FunnelBar label="Sesiones" value={page.sessions} max={page.sessions} color="bg-slate-300" />
          <FunnelBar label="Service clicks" value={page.service_clicks} max={page.sessions} color="bg-blue-400" />
          <FunnelBar label="WA clicks" value={page.whatsapp_clicks} max={page.sessions} color="bg-emerald-500" />
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Sesiones" value={page.sessions} />
          <Metric label="Page views" value={page.page_views} />
          <Metric label="Service clicks" value={page.service_clicks} />
          <Metric label="WA clicks" value={page.whatsapp_clicks} highlight />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Clicks totales: <span className="font-semibold text-slate-700">{totalSignal}</span></span>
          <span>Tasa WA: <span className="font-semibold text-emerald-700">{conversionRate}%</span></span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/sesiones?service=${page.service}`}
            className="bf-control border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
          >
            Ver sesiones
          </Link>
          <Link
            href={`/grabaciones?service=${page.service}`}
            className="bf-control text-slate-700 hover:bg-slate-50"
          >
            Ver replays
          </Link>
        </div>
      </div>
    </article>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  // Capped at 100%: service_clicks / whatsapp_clicks can exceed session count
  // because a single session may contain multiple clicks.
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] text-slate-500">{label}</span>
      <div className="flex-1 rounded-full bg-slate-200" style={{ height: 6 }}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-[11px] font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? "text-emerald-700" : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}
