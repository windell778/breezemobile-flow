export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
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
      description="Comportamiento, atribución e intención de visitantes anónimos."
    >
      {/* KPI bar — franja horizontal, no cards gigantes */}
      <section
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
        style={{ background: "var(--color-border)", borderColor: "var(--color-border)" }}
      >
        {[
          {
            label: "Sesiones",
            value: metrics.sessions,
            sub: `${metrics.visitors} visitantes`,
            href: "/sesiones",
          },
          {
            label: "WhatsApp",
            value: metrics.whatsappClicks,
            sub: "Señal de intención",
            href: "/eventos?event=whatsapp_click",
          },
          {
            label: "Servicios",
            value: metrics.serviceClicks,
            sub: "Clicks declarados",
            href: "/eventos?event=service_click",
          },
          {
            label: "Con grabación",
            value: `${metrics.replayRate}%`,
            sub: `${metrics.recordings} sesiones`,
            href: "/grabaciones",
          },
        ].map(({ label, value, sub, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]"
            style={{ background: "var(--color-surface)" }}
          >
            <span className="text-[11px] font-medium" style={{ color: "var(--color-text-3)" }}>
              {label}
            </span>
            <span
              className="mt-1.5 text-3xl font-bold tracking-tight"
              style={{ color: "var(--color-text-1)" }}
            >
              {value}
            </span>
            <span className="mt-1 text-xs" style={{ color: "var(--color-text-3)" }}>
              {sub}
            </span>
          </Link>
        ))}
      </section>

      <p className="mt-2 text-xs" style={{ color: "var(--color-text-3)" }}>
        Métricas agregadas · {timeAgo(metrics.cached_at)} · caché 15 min
      </p>

      {metricWarnings.length > 0 && (
        <div
          className="mt-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: "var(--color-warn-bg)",
            borderColor: "oklch(88% 0.07 75)",
            color: "var(--color-warn-text)",
          }}
        >
          <p className="font-semibold">Anomalías detectadas:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {metricWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Embudo de señal */}
      <section
        className="mt-5 overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
              Embudo de señal
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
              Etapas respaldadas por el tracking actual.
            </p>
          </div>
          <Link
            href="/eventos"
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--color-text-2)" }}
          >
            Ver eventos →
          </Link>
        </div>
        <div className="flex divide-x" style={{ borderColor: "var(--color-border)" }}>
          {[
            { step: "Fuente", detail: "Anuncio u orgánico", href: "/campanas", value: null },
            { step: "Servicio", detail: "Página visitada", href: "/servicios", value: null },
            {
              step: "Sesión",
              detail: "Capturada",
              href: "/sesiones",
              value: metrics.sessions,
            },
            {
              step: "Intención",
              detail: "WhatsApp click",
              href: "/eventos?event=whatsapp_click",
              value: metrics.whatsappClicks,
            },
          ].map(({ step, detail, href, value }) => (
            <Link
              key={step}
              href={href}
              className="group relative flex-1 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-text-3)" }}
              >
                {step}
              </p>
              {value !== null && (
                <p
                  className="mt-1 text-2xl font-bold tracking-tight"
                  style={{ color: "var(--color-text-1)" }}
                >
                  {value}
                </p>
              )}
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-2)" }}>
                {detail}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Lectura rápida + Sesiones recientes */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        {/* Lectura rápida */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <div
            className="border-b px-5 py-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
              Lectura rápida
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {metrics.topCampaign ? (
              <Link
                href={`/sesiones?campaign=${encodeURIComponent(metrics.topCampaign.name)}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Campaña con más señal
                  </p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                    {metrics.topCampaign.name}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-signal-text)" }}
                >
                  {metrics.topCampaign.whatsapp_clicks} WA
                </span>
              </Link>
            ) : null}

            {metrics.topService ? (
              <Link
                href={`/sesiones?service=${metrics.topService.service}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Servicio más activo
                  </p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                    {humanValue(metrics.topService.service)}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-primary-text)" }}
                >
                  {metrics.topService.whatsapp_clicks} WA
                </span>
              </Link>
            ) : null}

            {topHealthIssue ? (
              <Link
                href="/tracking"
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-warn-bg)]"
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-warn-text)" }}
                  >
                    Tracking
                  </p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                    {topHealthIssue.title}
                  </p>
                </div>
                <StatusBadge label={topHealthIssue.severity} />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Sesiones recientes */}
        <RecentSessions sessions={recentSessions} />
      </section>

      {/* Estado del tracking + Top campañas + Top servicios */}
      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <TrackingHealthSection items={trackingHealth.slice(0, 4)} />
        <CampaignsSection workspaceId={workspaceId} />
        <ServicesSection workspaceId={workspaceId} />
      </section>
    </AppShell>
  );
}

function TrackingHealthSection({
  items,
}: {
  items: Array<{ id: string; title: string; detail: string; severity: string }>;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Estado del tracking
        </h2>
        <Link
          href="/tracking"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--color-text-2)" }}
        >
          Ver todo →
        </Link>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {items.map((item) => (
          <Link
            key={item.id}
            href="/tracking"
            className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                {item.title}
              </p>
              <p
                className="mt-0.5 text-xs leading-4"
                style={{ color: "var(--color-text-2)" }}
              >
                {item.detail}
              </p>
            </div>
            <StatusBadge label={item.severity} />
          </Link>
        ))}
      </div>
    </div>
  );
}

async function CampaignsSection({ workspaceId }: { workspaceId: string }) {
  const campaigns = await getAdapter().getCampaignSummaries(workspaceId);
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Campañas
        </h2>
        <Link
          href="/campanas"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--color-text-2)" }}
        >
          Ver todas →
        </Link>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {campaigns.slice(0, 4).map((campaign) => (
          <Link
            key={`${campaign.source}-${campaign.name}`}
            href={`/sesiones?campaign=${encodeURIComponent(campaign.name)}`}
            className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                {campaign.name}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-3)" }}>
                {campaign.medium || "sin medio"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SourceBadge source={campaign.source} />
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--color-signal-text)" }}
              >
                {campaign.whatsapp_clicks} WA
              </span>
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
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Servicios
        </h2>
        <Link
          href="/servicios"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--color-text-2)" }}
        >
          Ver todos →
        </Link>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {services.slice(0, 4).map((page) => (
          <Link
            key={page.path}
            href={`/sesiones?service=${page.service}`}
            className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                {humanValue(page.service)}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-3)" }}>
                {page.path}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>
                {page.sessions} ses.
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--color-signal-text)" }}>
                {page.whatsapp_clicks} WA
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
