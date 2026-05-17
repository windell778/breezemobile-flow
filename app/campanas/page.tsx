export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { waRate } from "@/lib/metrics";
import type { Session, Source, CampaignSummary } from "@/lib/data/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Dimension = "source" | "medium" | "campaign" | "content";

const dimensions: { key: Dimension; label: string; caption: string }[] = [
  { key: "source", label: "Fuente", caption: "Meta Ads, Google Ads, Organic, Direct" },
  { key: "medium", label: "Medio", caption: "paid_social, cpc, seo, none" },
  { key: "campaign", label: "Campaña", caption: "utm_campaign" },
  { key: "content", label: "Anuncio / Creativo", caption: "utm_content o ad_id" },
];

type AttributionRow = {
  key: string;
  label: string;
  technical: string;
  source: Source;
  sessions: number;
  serviceClicks: number;
  whatsappClicks: number;
  rate: number;
};

function signalStyle(waClicks: number, sessions: number): { label: string; bg: string; color: string } {
  if (sessions === 0 || waClicks === 0)
    return { label: "Sin señal WA", bg: "var(--color-surface-2)", color: "var(--color-text-3)" };
  if (waClicks >= 3)
    return { label: "Alta señal", bg: "var(--color-signal-bg)", color: "var(--color-signal-text)" };
  return { label: "Señal baja", bg: "var(--color-warn-bg)", color: "var(--color-warn-text)" };
}

async function AttributionTable({ dimension }: { dimension: Dimension }) {
  const adapter = getAdapter();
  let rows: AttributionRow[];

  if (dimension === "campaign") {
    const campaigns = await adapter.getCampaignSummaries(DEFAULT_WORKSPACE_ID);
    rows = buildRowsFromCampaigns(campaigns);
  } else {
    const sessions = await adapter.listSessions(DEFAULT_WORKSPACE_ID);
    rows = buildAttributionRows(sessions, dimension);
  }

  if (rows.length === 0) {
    return <EmptyState message="No hay datos de atribución disponibles para esta dimensión." />;
  }

  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border bf-defer"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Cabecera */}
      <div
        className="hidden grid-cols-[1.2fr_120px_80px_100px_100px_90px_110px] border-b px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] md:grid"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-3)",
        }}
      >
        <span>Dimensión</span>
        <span>Fuente</span>
        <span>Sesiones</span>
        <span>Clicks servicios</span>
        <span>WhatsApp</span>
        <span>% WA</span>
        <span>Señal</span>
      </div>

      {rows.map((row) => {
        const signal = signalStyle(row.whatsappClicks, row.sessions);
        return (
          <article
            key={row.key}
            className="grid gap-3 border-b px-5 py-3.5 text-sm transition-colors hover:bg-[var(--color-surface-2)] md:grid-cols-[1.2fr_120px_80px_100px_100px_90px_110px] md:items-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div>
              <p className="font-semibold" style={{ color: "var(--color-text-1)" }}>
                {row.label}
              </p>
              <p className="font-mono text-xs" style={{ color: "var(--color-text-3)" }}>
                {row.technical || "—"}
              </p>
            </div>
            <SourceBadge source={row.source} />
            <span className="font-semibold" style={{ color: "var(--color-text-1)" }}>
              {row.sessions}
            </span>
            <span style={{ color: "var(--color-text-2)" }}>{row.serviceClicks}</span>
            <span className="font-semibold" style={{ color: "var(--color-signal-text)" }}>
              {row.whatsappClicks}
            </span>
            <div>
              <span style={{ color: "var(--color-text-2)" }}>{row.rate}%</span>
              <Link
                href={buildSessionsHref(dimension, row)}
                className="mt-0.5 block text-xs font-medium transition-colors"
                style={{ color: "var(--color-primary-text)" }}
              >
                Ver sesiones
              </Link>
            </div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: signal.bg, color: signal.color }}
            >
              {signal.label}
            </span>
          </article>
        );
      })}
    </section>
  );
}

function AttributionTableLoading() {
  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border bf-defer"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-5 py-3.5"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="h-4 w-32 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
          <div className="h-4 w-20 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
          <div className="h-4 w-12 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
        </div>
      ))}
    </section>
  );
}

export default async function CampanasPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const activeDimension = String(params.dimension || "campaign") as Dimension;
  const safeDimension = dimensions.some((item) => item.key === activeDimension)
    ? activeDimension
    : "campaign";

  return (
    <AppShell
      title="Campañas y fuentes"
      description="Compara campañas, fuentes y anuncios según las visitas y clicks que generan."
    >
      {/* Selector de dimensión */}
      <section
        className="overflow-hidden rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <div className="flex flex-wrap gap-2">
          {dimensions.map((dimension) => (
            <Link
              key={dimension.key}
              href={`/campanas?dimension=${dimension.key}`}
              className="bf-chip transition-colors"
              style={
                safeDimension === dimension.key
                  ? {
                      borderColor: "var(--color-primary)",
                      background: "var(--color-primary-bg)",
                      color: "var(--color-primary)",
                    }
                  : {
                      borderColor: "var(--color-border)",
                      background: "transparent",
                      color: "var(--color-text-2)",
                    }
              }
            >
              {dimension.label}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--color-text-2)" }}>
          {dimensions.find((item) => item.key === safeDimension)?.caption}
        </p>
      </section>

      <Suspense fallback={<AttributionTableLoading />}>
        <AttributionTable dimension={safeDimension} />
      </Suspense>

      <p className="mt-4 text-xs" style={{ color: "var(--color-text-3)" }}>
        Un click a WhatsApp muestra intención, pero no confirma un lead calificado ni una venta.
      </p>
    </AppShell>
  );
}

// ─── Row builders ─────────────────────────────────────────────────────────────

function buildRowsFromCampaigns(campaigns: CampaignSummary[]): AttributionRow[] {
  return campaigns
    .map((c) => ({
      key: `campaign:${c.name}:${c.source}`,
      label: c.name || "Sin campaña",
      technical: c.campaign_id || "",
      source: c.source,
      sessions: c.sessions,
      serviceClicks: c.service_clicks,
      whatsappClicks: c.whatsapp_clicks,
      rate: waRate(c.whatsapp_clicks, c.sessions),
    }))
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.sessions - a.sessions);
}

function getDimensionValue(session: Session, dimension: Dimension) {
  if (dimension === "source")
    return { label: session.source, technical: session.attribution.utm_source || session.source };
  if (dimension === "medium")
    return { label: session.attribution.utm_medium || "none", technical: session.attribution.utm_medium || "" };
  if (dimension === "content")
    return { label: session.attribution.utm_content || session.attribution.ad_id || "Sin anuncio", technical: session.attribution.ad_id };
  return { label: session.attribution.utm_campaign || "Sin campaña", technical: session.attribution.campaign_id };
}

function buildAttributionRows(sessions: Session[], dimension: Dimension): AttributionRow[] {
  const grouped = sessions.reduce<Record<string, Omit<AttributionRow, "rate">>>(
    (acc, session) => {
      const value = getDimensionValue(session, dimension);
      const key = `${dimension}:${value.label}:${session.source}`;
      acc[key] ||= {
        key,
        label: value.label,
        technical: value.technical,
        source: session.source,
        sessions: 0,
        serviceClicks: 0,
        whatsappClicks: 0,
      };
      acc[key].sessions += 1;
      acc[key].serviceClicks += session.events.filter((e) => e.event_name === "service_click").length;
      acc[key].whatsappClicks += session.events.filter((e) => e.event_name === "whatsapp_click").length;
      return acc;
    },
    {},
  );

  return Object.values(grouped)
    .map((row) => ({ ...row, rate: waRate(row.whatsappClicks, row.sessions) }))
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.sessions - a.sessions);
}

function buildSessionsHref(dimension: Dimension, row: AttributionRow): string {
  const enc = encodeURIComponent;
  if (dimension === "campaign") return `/sesiones?campaign=${enc(row.label)}`;
  if (dimension === "source")   return `/sesiones?source=${enc(row.label)}`;
  if (dimension === "medium")   return `/sesiones?medium=${enc(row.label)}`;
  if (dimension === "content") {
    const val = row.label === "Sin anuncio" ? "__missing__" : row.label;
    return `/sesiones?content=${enc(val)}`;
  }
  return `/sesiones?q=${enc(row.label)}`;
}
