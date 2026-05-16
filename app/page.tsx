export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { validateMetrics, timeAgo } from "@/lib/metrics";
import { humanValue } from "@/lib/labels";

export default async function Home() {
  const adapter = getAdapter();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [metrics, trackingHealth, recentSessions] = await Promise.all([
    adapter.getDashboardMetrics(workspaceId),
    adapter.getTrackingHealth(workspaceId),
    adapter.listSessions(workspaceId, { limit: 6 }),
  ]);

  const metricWarnings = validateMetrics(metrics);
  const topHealthIssue = trackingHealth.find((i) => i.severity === "Alto") ?? trackingHealth[0];

  return (
    <AppShell
      title="Resumen general"
      description="Comportamiento, atribución e intención de visitantes anónimos con datos operativos recientes."
    >
      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/sesiones" className="block transition hover:-translate-y-0.5">
          <MetricCard
            label="Sesiones capturadas"
            value={metrics.sessions}
            detail={`${metrics.visitors} visitantes anónimos.`}
          />
        </Link>
        <Link href="/eventos?event=whatsapp_click" className="block transition hover:-translate-y-0.5">
          <MetricCard
            label="Clicks a WhatsApp"
            value={metrics.whatsappClicks}
            detail="Señal de alta intención (anónima)."
          />
        </Link>
        <Link href="/eventos?event=service_click" className="block transition hover:-translate-y-0.5">
          <MetricCard
            label="Clicks en servicios"
            value={metrics.serviceClicks}
            detail="Interés declarado por servicio."
          />
        </Link>
        <Link href="/grabaciones" className="block transition hover:-translate-y-0.5">
          <MetricCard
            label="Con grabación"
            value={`${metrics.replayRate}%`}
            detail={`${metrics.recordings} sesiones con grabación.`}
          />
        </Link>
      </section>

      <p className="mt-2 text-xs text-slate-400">
        Métricas agregadas · {timeAgo(metrics.cached_at)} · caché 15 min
      </p>

      {metricWarnings.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-semibold">Anomalías detectadas:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {metricWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Funnel + Quick read */}
      <section className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        {/* Observable funnel */}
        <div className="bf-panel p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Embudo de señal</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Solo se muestran etapas respaldadas por el tracking actual.
              </p>
            </div>
            <Link href="/eventos" className="bf-control text-slate-600 hover:bg-slate-50">
              Ver eventos
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              { step: "Fuente", label: "Anuncio u orgánico", href: "/campanas" },
              { step: "Servicio", label: "Página visitada", href: "/servicios" },
              { step: "Sesión", label: "Capturada", href: "/sesiones" },
              { step: "Intención", label: "WhatsApp click", href: "/eventos?event=whatsapp_click" },
            ].map(({ step, label, href }, index) => (
              <Link
                key={step}
                href={href}
                className="group rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Paso {index + 1}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950">{step}</p>
                <p className="mt-0.5 text-xs text-slate-500">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick read */}
        <div className="bf-panel p-4">
          <h2 className="text-base font-semibold text-slate-950">Lectura rápida</h2>
          <div className="mt-3 space-y-2 text-sm">
            {metrics.topCampaign ? (
              <Link
                href={`/sesiones?campaign=${encodeURIComponent(metrics.topCampaign.name)}`}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Campaña con más señal</p>
                  <p className="mt-0.5 font-medium text-slate-950">{metrics.topCampaign.name}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">
                  {metrics.topCampaign.whatsapp_clicks} WA
                </span>
              </Link>
            ) : null}

            {metrics.topService ? (
              <Link
                href={`/sesiones?service=${metrics.topService.service}`}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Servicio más activo</p>
                  <p className="mt-0.5 font-medium text-slate-950">{humanValue(metrics.topService.service)}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {metrics.topService.whatsapp_clicks} WA
                </span>
              </Link>
            ) : null}

            {topHealthIssue ? (
              <Link
                href="/tracking"
                className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 hover:bg-amber-100"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-amber-600">Tracking</p>
                  <p className="mt-0.5 font-medium text-amber-900">{topHealthIssue.title}</p>
                </div>
                <StatusBadge label={topHealthIssue.severity} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Recent sessions + Tracking Health */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <RecentSessions sessions={recentSessions} />

        <div className="bf-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">Estado del tracking</h2>
            <Link href="/tracking" className="text-xs font-medium text-slate-500 hover:text-slate-900">
              Ver todo →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {trackingHealth.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href="/tracking"
                className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-950">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-4">{item.detail}</p>
                </div>
                <StatusBadge label={item.severity} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top campaigns + services */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <CampaignsSection workspaceId={workspaceId} />
        <ServicesSection workspaceId={workspaceId} />
      </section>
    </AppShell>
  );
}

async function CampaignsSection({ workspaceId }: { workspaceId: string }) {
  const campaigns = await getAdapter().getCampaignSummaries(workspaceId);
  return (
    <div className="bf-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Campañas / señal</h2>
        <Link href="/campanas" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          Ver todas →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {campaigns.slice(0, 4).map((campaign) => (
          <Link
            key={`${campaign.source}-${campaign.name}`}
            href={`/sesiones?campaign=${encodeURIComponent(campaign.name)}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-950">{campaign.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{campaign.medium || "—"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SourceBadge source={campaign.source} />
              <span className="text-xs font-semibold text-emerald-600">{campaign.whatsapp_clicks} WA</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function ServicesSection({ workspaceId }: { workspaceId: string }) {
  const services = await getAdapter().getServiceSummaries(workspaceId);
  return (
    <div className="bf-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Servicios / señal</h2>
        <Link href="/servicios" className="text-xs font-medium text-slate-500 hover:text-slate-900">
          Ver todos →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {services.slice(0, 4).map((page) => (
          <Link
            key={page.path}
            href={`/sesiones?service=${page.service}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-950">{humanValue(page.service)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{page.path}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-700">{page.sessions} ses.</p>
              <p className="text-xs text-emerald-600">{page.whatsapp_clicks} WA</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
