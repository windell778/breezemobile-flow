export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { formatDateTime, formatDuration, humanValue, shortId } from "@/lib/labels";
import { mainEventLabel, sessionHasEvent } from "@/lib/analytics";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Session, SessionFilters, Source, ServiceKey, EventName } from "@/lib/data/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_LIMIT = 25;

function parsePositiveInt(value: string, fallback: number): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const filterChips = [
  { key: "todas", label: "Todas" },
  { key: "whatsapp", label: "Click a WhatsApp" },
  { key: "service", label: "Click en servicio" },
  { key: "sin_interaccion", label: "Sin interacción" },
  { key: "meta", label: "Meta Ads" },
  { key: "direct", label: "Direct" },
  { key: "replay", label: "Con grabación" },
];

const intentBorder: Record<string, string> = {
  Alta: "border-l-emerald-500",
  Media: "border-l-amber-400",
  Baja: "border-l-slate-300",
};

type TableParams = {
  filter: string;
  query: string;
  service: string;
  source: string;
  medium: string;
  content: string;
  event: string;
  campaign: string;
  page: number;
  limit: number;
};

function buildPageHref(p: TableParams, newPage: number): string {
  const q = new URLSearchParams();
  if (p.filter !== "todas") q.set("filter", p.filter);
  if (p.query) q.set("q", p.query);
  if (p.service) q.set("service", p.service);
  if (p.source) q.set("source", p.source);
  if (p.medium) q.set("medium", p.medium);
  if (p.content) q.set("content", p.content);
  if (p.event) q.set("event", p.event);
  if (p.campaign) q.set("campaign", p.campaign);
  if (p.limit !== DEFAULT_LIMIT) q.set("limit", String(p.limit));
  q.set("page", String(newPage));
  return `/sesiones?${q.toString()}`;
}

async function SessionsTable({ p }: { p: TableParams }) {
  const adapterFilters: SessionFilters = {};

  if (p.filter === "meta") adapterFilters.source = "Meta Ads";
  else if (p.filter === "direct") adapterFilters.source = "Direct";
  else if (p.source) adapterFilters.source = p.source as Source;

  if (p.service) adapterFilters.service = p.service as ServiceKey;
  if (p.medium) adapterFilters.medium = p.medium;
  if (p.content) adapterFilters.content = p.content;
  if (p.query) adapterFilters.search = p.query;
  if (p.filter === "replay") adapterFilters.hasRecording = true;
  if (p.filter === "whatsapp") adapterFilters.eventName = "whatsapp_click";
  else if (p.filter === "service") adapterFilters.eventName = "service_click";
  if (p.event) adapterFilters.eventName = p.event as EventName;

  // Fetch limit+1 to detect whether a next page exists without a separate
  // count query. JS post-filters (sin_interaccion, campaign) are rare enough
  // that occasional off-by-one is acceptable at V0 volumes.
  adapterFilters.limit = p.limit + 1;
  adapterFilters.offset = (p.page - 1) * p.limit;

  const allSessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID, adapterFilters);

  // JS-level filters the adapter doesn't model yet (see data-flow-and-adapter.md §9).
  const visible = allSessions.filter((session) => {
    const matchesSinInteraccion = p.filter !== "sin_interaccion" || session.events.length === 1;
    const matchesCampaign = !p.campaign || session.attribution.utm_campaign.toLowerCase() === p.campaign;
    return matchesSinInteraccion && matchesCampaign;
  });

  const hasNextPage = visible.length > p.limit;
  const display = visible.slice(0, p.limit);

  if (display.length === 0) {
    return <EmptyState message="No se encontraron sesiones con los filtros actuales." />;
  }

  const whatsappCount = display.filter((s) => sessionHasEvent(s, "whatsapp_click")).length;
  const replayCount = display.filter((s) => s.recording?.status === "available").length;

  return (
    <>
      <section className="grid gap-3 md:grid-cols-4">
        <MiniMetric label="Sesiones esta página" value={display.length} />
        <MiniMetric label="Clicks a WhatsApp" value={whatsappCount} />
        <MiniMetric label="Con grabación" value={replayCount} />
        <MiniMetric label="Página" value={p.page} />
      </section>

      <section className="bf-panel bf-defer mt-4 overflow-hidden">
        <div className="hidden grid-cols-[150px_180px_1.1fr_1fr_1fr_130px] border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 xl:grid">
          <span>Inicio</span>
          <span>Sesión</span>
          <span>Visitante / servicio</span>
          <span>Fuente</span>
          <span>Atribución</span>
          <span>Actividad</span>
        </div>
        {display.map((session) => (
          <SessionRow key={session.session_id} session={session} />
        ))}

        {/* Pagination controls inside the panel */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Página {p.page} · {display.length} sesión{display.length !== 1 ? "es" : ""}
            {hasNextPage ? " · hay más" : ""}
          </p>
          <div className="flex items-center gap-2">
            {p.page > 1 ? (
              <Link href={buildPageHref(p, p.page - 1)} className="bf-control text-slate-700 hover:bg-slate-50">
                ← Anterior
              </Link>
            ) : (
              <span className="bf-control cursor-not-allowed text-slate-300">← Anterior</span>
            )}
            {hasNextPage ? (
              <Link href={buildPageHref(p, p.page + 1)} className="bf-control text-slate-700 hover:bg-slate-50">
                Siguiente →
              </Link>
            ) : (
              <span className="bf-control cursor-not-allowed text-slate-300">Siguiente →</span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SessionRow({ session }: { session: Session }) {
  const hasRecording = session.recording?.status === "available";
  return (
    <article
      className={`bf-row relative border-l-2 xl:grid xl:grid-cols-[150px_180px_1.1fr_1fr_1fr_130px] xl:items-center ${
        intentBorder[session.intent_level] ?? "border-l-slate-200"
      }`}
    >
      <Link
        href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
        aria-label={`Ver visitante ${shortId(session.visitor_id)} · sesión ${shortId(session.session_id)}`}
        className="absolute inset-0 z-10"
      />
      <div className="pointer-events-none grid gap-3 px-3 py-2.5 text-sm xl:contents">
        <div className="text-slate-500">
          <p>{formatDateTime(session.timestamp)}</p>
          <p className="mt-1 font-mono text-xs">{formatDuration(session.duration)}</p>
        </div>
        <div>
          <p className="font-mono font-semibold text-cyan-700">{shortId(session.session_id)}</p>
          <p className="mt-1 text-xs text-slate-500">{session.events.length} eventos</p>
        </div>
        <div>
          <p className="font-mono font-medium text-slate-950">{shortId(session.visitor_id)}</p>
          <p className="mt-1 text-slate-600">{humanValue(session.service)} · {session.page_path}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceBadge source={session.source} />
          <StatusBadge label={`${session.intent_level} intención`} />
        </div>
        <div>
          <p className="font-medium text-slate-950">{session.attribution.utm_campaign || "Sin campaña"}</p>
          <p className="mt-1 text-slate-500">{session.attribution.utm_content || session.attribution.ad_id || "Sin anuncio"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={mainEventLabel(session)} />
          {hasRecording && (
            <Link
              href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`}
              className="pointer-events-auto relative z-20 rounded-md border border-blue-200 px-1.5 py-1 text-xs text-blue-700 hover:bg-blue-50"
            >
              Ver grabación
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function SessionsLoading() {
  return (
    <>
      <section className="grid gap-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bf-panel animate-pulse p-3">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <section className="bf-panel bf-defer mt-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-slate-100 px-3 py-3">
            <div className="flex gap-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 flex-1 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export default async function SesionesPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const filter = String(params.filter || "todas");
  const query = String(params.q || "").trim().toLowerCase();
  const service = String(params.service || "");
  const source = String(params.source || "");
  const medium = String(params.medium || "");
  const content = String(params.content || "");
  const event = String(params.event || "");
  const campaign = String(params.campaign || "").toLowerCase();
  const page = parsePositiveInt(String(params.page || ""), 1);
  const limit = Math.min(100, Math.max(5, parsePositiveInt(String(params.limit || ""), DEFAULT_LIMIT)));

  const p: TableParams = { filter, query, service, source, medium, content, event, campaign, page, limit };

  return (
    <AppShell
      title="Sesiones"
      description="Revisa cada visita: de dónde vino, qué servicio vio, qué hizo y si hay grabación."
    >
      <section className="bf-panel p-3">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={String(params.q || "")}
            placeholder="Buscar por sesión, visitante, servicio, campaña, anuncio o página..."
            className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
          <button className="h-9 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
            Buscar
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {filterChips.map((item) => (
            <Link
              key={item.key}
              href={`/sesiones?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`bf-chip ${
                filter === item.key
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {service ? <ActiveChip label={`Servicio: ${humanValue(service)}`} href="/sesiones" /> : null}
          {source ? <ActiveChip label={`Fuente: ${source}`} href="/sesiones" /> : null}
          {medium ? <ActiveChip label={`Medio: ${medium}`} href="/sesiones" /> : null}
          {content ? <ActiveChip label={`Contenido: ${content}`} href="/sesiones" /> : null}
          {event ? <ActiveChip label={`Evento: ${humanValue(event)}`} href="/sesiones" /> : null}
          {campaign ? <ActiveChip label={`Campaña: ${campaign}`} href="/sesiones" /> : null}
        </div>
      </section>

      <div className="mt-4">
        <Suspense fallback={<SessionsLoading />}>
          <SessionsTable p={p} />
        </Suspense>
      </div>
    </AppShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActiveChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="bf-chip border-amber-200 bg-amber-50 text-amber-800">
      {label} ×
    </Link>
  );
}
