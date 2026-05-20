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

function signalLabel(waClicks: number, sessions: number): { label: string; cls: string } {
  if (sessions === 0) return { label: "Sin datos", cls: "bg-slate-100 text-slate-500" };
  if (waClicks === 0) return { label: "Sin señal WA", cls: "bg-slate-100 text-slate-500" };
  if (waClicks >= 3) return { label: "Alta señal", cls: "bg-emerald-100 text-emerald-700" };
  return { label: "Señal baja", cls: "bg-amber-100 text-amber-700" };
}

async function AttributionTable({ dimension }: { dimension: Dimension }) {
  const adapter = getAdapter();
  let rows: AttributionRow[];

  if (dimension === "campaign") {
    // getCampaignSummaries() avoids loading all sessions for this dimension.
    // PostHogAdapter uses an aggregate HogQL query; MockAdapter uses static data.
    // TODO: build equivalent aggregate methods for source/medium/content dimensions.
    const campaigns = await adapter.getCampaignSummaries(DEFAULT_WORKSPACE_ID);
    rows = buildRowsFromCampaigns(campaigns);
  } else {
    // V0: build aggregate from listSessions for source/medium/content.
    // Acceptable at current volumes; replace with adapter-level HogQL
    // aggregate queries before data exceeds ~500 sessions.
    const sessions = await adapter.listSessions(DEFAULT_WORKSPACE_ID);
    rows = buildAttributionRows(sessions, dimension);
  }

  if (rows.length === 0) {
    return <EmptyState message="No hay datos de atribución disponibles para esta dimensión." />;
  }

  return (
    <section className="bf-apple-table bf-defer mt-4">
      <div className="bf-apple-table-header grid px-4 py-3 md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px]">
        <span>Dimensión</span>
        <span>Fuente</span>
        <span>Sesiones</span>
        <span>Clicks en servicios</span>
        <span>Clicks a WhatsApp</span>
        <span>% WhatsApp</span>
        <span>Señal</span>
      </div>
      <div className="bf-premium-table-body">
      {rows.map((row) => {
        const signal = signalLabel(row.whatsappClicks, row.sessions);
        return (
          <article
            key={row.key}
            className="bf-apple-row grid gap-3 px-4 py-3 text-sm md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px] md:items-center"
          >
            <div>
              <p className="font-semibold text-slate-950">{row.label}</p>
              <p className="mt-1 font-mono text-xs text-slate-400">{row.technical || "—"}</p>
            </div>
            <SourceBadge source={row.source} />
            <span className="font-semibold text-slate-950">{row.sessions}</span>
            <span className="text-slate-700">{row.serviceClicks}</span>
            <span className="font-semibold text-emerald-700">{row.whatsappClicks}</span>
            <span className="text-slate-600">
              {row.rate}%
              <Link
                href={buildSessionsHref(dimension, row)}
                className="mt-1 block text-xs font-medium text-[var(--apple-blue)] hover:underline"
              >
                Ver sesiones
              </Link>
            </span>
            <span className={`bf-apple-pill ${signal.cls}`}>
              {signal.label}
            </span>
          </article>
        );
      })}
      </div>
    </section>
  );
}

function AttributionTableLoading() {
  return (
    <section className="bf-apple-table bf-defer mt-4">
      <div className="bf-apple-table-header grid px-4 py-3 md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px]">
        <span>Dimensión</span>
        <span>Fuente</span>
        <span>Sesiones</span>
        <span>Clicks en servicios</span>
        <span>Clicks a WhatsApp</span>
        <span>% WhatsApp</span>
        <span>Señal</span>
      </div>
      <div className="bf-premium-table-body">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bf-apple-row animate-pulse px-4 py-4">
            <div className="flex gap-4">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
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
      <section className="bf-panel p-3">
        <div className="flex flex-wrap gap-2">
          {dimensions.map((dimension) => (
            <Link
              key={dimension.key}
              href={`/campanas?dimension=${dimension.key}`}
              className={`bf-chip ${
                safeDimension === dimension.key
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dimension.label}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {dimensions.find((item) => item.key === safeDimension)?.caption}
        </p>
      </section>

      <Suspense fallback={<AttributionTableLoading />}>
        <AttributionTable dimension={safeDimension} />
      </Suspense>

      <p className="mt-4 text-xs text-slate-400">
        Un click a WhatsApp muestra intención, pero todavía no confirma un lead calificado ni una venta.
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
    {}
  );

  return Object.values(grouped)
    .map((row) => ({ ...row, rate: waRate(row.whatsappClicks, row.sessions) }))
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.sessions - a.sessions);
}

// Build correct /sesiones filter URL based on the active attribution dimension.
// Each dimension maps to an explicit adapter-level filter so results are accurate.
function buildSessionsHref(dimension: Dimension, row: AttributionRow): string {
  const enc = encodeURIComponent;
  if (dimension === "campaign") return `/sesiones?campaign=${enc(row.label)}`;
  if (dimension === "source")   return `/sesiones?source=${enc(row.label)}`;
  if (dimension === "medium")   return `/sesiones?medium=${enc(row.label)}`;
  // "Sin anuncio" means both utm_content and ad_id are empty; use sentinel so
  // the adapter can match on empty fields rather than the human-readable label.
  if (dimension === "content") {
    const val = row.label === "Sin anuncio" ? "__missing__" : row.label;
    return `/sesiones?content=${enc(val)}`;
  }
  return `/sesiones?q=${enc(row.label)}`;
}
