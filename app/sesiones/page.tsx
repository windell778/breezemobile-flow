export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { IntentBadge } from "@/components/ui/IntentBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { formatDateTime, humanValue, shortId } from "@/lib/labels";
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

  // Fetch limit+1 to detect next page without a separate count query.
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
      {/* Mini-métricas de la página actual */}
      <section
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border md:grid-cols-4"
        style={{ background: "var(--color-border)", borderColor: "var(--color-border)" }}
      >
        {[
          { label: "Sesiones esta página", value: display.length },
          { label: "Clicks a WhatsApp", value: whatsappCount },
          { label: "Con grabación", value: replayCount },
          { label: "Página", value: p.page },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col px-4 py-3"
            style={{ background: "var(--color-surface)" }}
          >
            <span className="text-[10px] font-medium" style={{ color: "var(--color-text-3)" }}>
              {label}
            </span>
            <span className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-1)" }}>
              {value}
            </span>
          </div>
        ))}
      </section>

      {/* Tabla de sesiones */}
      <section
        className="mt-4 overflow-hidden rounded-xl border bf-defer"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {/* Cabecera de columnas — solo desktop */}
        <div
          className="hidden grid-cols-[80px_1fr_120px_160px_120px] border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] xl:grid"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-3)",
          }}
        >
          <span>Fecha</span>
          <span>Visitante / servicio</span>
          <span>Fuente</span>
          <span>Campaña</span>
          <span>Actividad</span>
        </div>

        {display.map((session) => (
          <SessionRow key={session.session_id} session={session} serviceFilter={p.service} />
        ))}

        {/* Paginación */}
        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
            Página {p.page} · {display.length} sesión{display.length !== 1 ? "es" : ""}
            {hasNextPage ? " · hay más" : ""}
          </p>
          <div className="flex items-center gap-2">
            {p.page > 1 ? (
              <Link
                href={buildPageHref(p, p.page - 1)}
                className="bf-control transition-colors hover:bg-[var(--color-surface)]"
                style={{ color: "var(--color-text-1)" }}
              >
                ← Anterior
              </Link>
            ) : (
              <span className="bf-control cursor-not-allowed" style={{ color: "var(--color-text-3)" }}>
                ← Anterior
              </span>
            )}
            {hasNextPage ? (
              <Link
                href={buildPageHref(p, p.page + 1)}
                className="bf-control transition-colors hover:bg-[var(--color-surface)]"
                style={{ color: "var(--color-text-1)" }}
              >
                Siguiente →
              </Link>
            ) : (
              <span className="bf-control cursor-not-allowed" style={{ color: "var(--color-text-3)" }}>
                Siguiente →
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SessionRow({ session, serviceFilter }: { session: Session; serviceFilter?: string }) {
  const hasRecording = session.recording?.status === "available";
  const includesFilteredService =
    serviceFilter &&
    session.service !== serviceFilter &&
    session.events.some((e) => e.service === serviceFilter);

  return (
    <article
      className="relative flex items-start gap-4 border-b px-4 py-3.5 transition-colors hover:bg-[var(--color-surface-2)] xl:grid xl:grid-cols-[80px_1fr_120px_160px_120px] xl:items-center"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Stretched link — Visitor Intelligence */}
      <Link
        href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
        aria-label={`Ver visitante ${shortId(session.visitor_id)}`}
        className="absolute inset-0 z-10"
      />

      {/* Fecha */}
      <div className="shrink-0 pt-0.5">
        <p className="font-mono text-[11px]" style={{ color: "var(--color-text-3)" }}>
          {formatDateTime(session.timestamp).split(" ")[0]}
        </p>
        <p className="font-mono text-[11px]" style={{ color: "var(--color-text-3)" }}>
          {formatDateTime(session.timestamp).split(" ")[1]}
        </p>
      </div>

      {/* Visitante / servicio */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text-1)" }}>
            {shortId(session.visitor_id)}
          </span>
          <IntentBadge level={session.intent_level} />
          {hasRecording && (
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--color-signal-text)" }}
            >
              ● grabación
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm" style={{ color: "var(--color-text-2)" }}>
          {humanValue(session.service)} · {session.page_path}
        </p>
        {includesFilteredService && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-warn-text)" }}>
            Incluye eventos de {humanValue(serviceFilter)}
          </p>
        )}
      </div>

      {/* Fuente */}
      <div className="shrink-0">
        <SourceBadge source={session.source} />
      </div>

      {/* Campaña */}
      <div className="hidden shrink-0 xl:block">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
          {session.attribution.utm_campaign || "Sin campaña"}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-3)" }}>
          {session.attribution.utm_content || session.attribution.ad_id || "Sin anuncio"}
        </p>
      </div>

      {/* Actividad + botón grabación (z-20 sobre stretched link) */}
      <div className="hidden shrink-0 items-center gap-2 xl:flex">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-2)" }}
        >
          {mainEventLabel(session)}
        </span>
        {hasRecording && (
          <Link
            href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`}
            className="relative z-20 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--color-surface)]"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-2)",
            }}
          >
            Ver grabación
          </Link>
        )}
      </div>
    </article>
  );
}

function SessionsLoading() {
  return (
    <>
      <section
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border md:grid-cols-4"
        style={{ background: "var(--color-border)" }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col px-4 py-3" style={{ background: "var(--color-surface)" }}>
            <div className="h-2.5 w-24 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
            <div className="mt-2 h-7 w-12 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
          </div>
        ))}
      </section>
      <section
        className="mt-4 overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 border-b px-4 py-3.5"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="h-8 w-16 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
              <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: "var(--color-surface-2)" }} />
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
      description="De dónde vino cada visitante, qué servicio vio, qué hizo, y si hay grabación."
    >
      {/* Barra de filtros */}
      <section
        className="overflow-hidden rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={String(params.q || "")}
            placeholder="Buscar por sesión, visitante, servicio, campaña..."
            className="h-9 rounded-lg border px-3 text-sm outline-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text-1)",
            }}
          />
          <button
            className="h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            Buscar
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {filterChips.map((item) => (
            <Link
              key={item.key}
              href={`/sesiones?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className="bf-chip transition-colors"
              style={
                filter === item.key
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
              {item.label}
            </Link>
          ))}

          {/* Active chips — filtros externos */}
          {service && <ActiveChip label={`Servicio: ${humanValue(service)}`} href="/sesiones" />}
          {source && <ActiveChip label={`Fuente: ${source}`} href="/sesiones" />}
          {medium && <ActiveChip label={`Medio: ${medium}`} href="/sesiones" />}
          {content && (
            <ActiveChip
              label={`Contenido: ${content === "__missing__" ? "Sin anuncio" : content}`}
              href="/sesiones"
            />
          )}
          {event && <ActiveChip label={`Evento: ${humanValue(event)}`} href="/sesiones" />}
          {campaign && <ActiveChip label={`Campaña: ${campaign}`} href="/sesiones" />}
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

function ActiveChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="bf-chip transition-colors"
      style={{
        borderColor: "oklch(88% 0.07 75)",
        background: "var(--color-warn-bg)",
        color: "var(--color-warn-text)",
      }}
    >
      {label} ×
    </Link>
  );
}
