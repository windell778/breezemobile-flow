export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { waRate } from "@/lib/metrics";
import type { Session, Source } from "@/lib/data/types";

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

function signalLabel(waClicks: number, sessions: number): { label: string; cls: string } {
  if (sessions === 0) return { label: "Sin datos", cls: "bg-slate-100 text-slate-500" };
  if (waClicks === 0) return { label: "Sin señal WA", cls: "bg-slate-100 text-slate-500" };
  if (waClicks >= 3) return { label: "Alta señal", cls: "bg-emerald-100 text-emerald-700" };
  if (waClicks >= 1) return { label: "Señal baja", cls: "bg-amber-100 text-amber-700" };
  return { label: "Sin señal", cls: "bg-slate-100 text-slate-500" };
}

async function AttributionTable({ dimension }: { dimension: Dimension }) {
  const sessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID);
  const rows = buildAttributionRows(sessions, dimension);

  return (
    <section className="bf-panel bf-defer mt-4 overflow-hidden">
      <div className="grid border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px]">
        <span>Dimensión</span>
        <span>Fuente</span>
        <span>Sesiones</span>
        <span>Service clicks</span>
        <span>WA clicks</span>
        <span>Tasa WA</span>
        <span>Señal</span>
      </div>
      {rows.map((row) => {
        const signal = signalLabel(row.whatsappClicks, row.sessions);
        return (
          <article
            key={row.key}
            className="bf-row grid gap-3 px-3 py-2.5 text-sm md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px] md:items-center"
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
                href={`/sesiones?q=${encodeURIComponent(row.label)}`}
                className="mt-1 block text-xs font-medium text-blue-700 hover:underline"
              >
                Ver sesiones
              </Link>
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${signal.cls}`}>
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
    <section className="bf-panel bf-defer mt-4 overflow-hidden">
      <div className="grid border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[1.2fr_120px_100px_120px_120px_110px_120px]">
        <span>Dimensión</span>
        <span>Fuente</span>
        <span>Sesiones</span>
        <span>Service clicks</span>
        <span>WA clicks</span>
        <span>Tasa WA</span>
        <span>Señal</span>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse border-b border-slate-100 px-3 py-3">
          <div className="flex gap-4">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-4 w-16 rounded bg-slate-200" />
          </div>
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
      description="Señal de intención por dimensión de atribución. El foco es comportamiento observable, no gasto ni revenue."
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
        Señal de intención = whatsapp_click · Costo por sesión y ROAS se agregarán cuando se conecte Meta Ads API.
      </p>
    </AppShell>
  );
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

function buildAttributionRows(sessions: Session[], dimension: Dimension) {
  const grouped = sessions.reduce<
    Record<
      string,
      { label: string; technical: string; source: Source; sessions: number; serviceClicks: number; whatsappClicks: number }
    >
  >((acc, session) => {
    const value = getDimensionValue(session, dimension);
    const key = `${dimension}:${value.label}:${session.source}`;
    acc[key] ||= {
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
  }, {});

  return Object.entries(grouped)
    .map(([key, row]) => ({ key, ...row, rate: waRate(row.whatsappClicks, row.sessions) }))
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.sessions - a.sessions);
}
