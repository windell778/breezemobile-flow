export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterBar";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { sessionHasEvent } from "@/lib/analytics";
import { formatDateTime, shortId } from "@/lib/labels";
import type { EventName, Session, SessionFilters, ServiceKey, Source } from "@/lib/data/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SessionParams = {
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

const DEFAULT_LIMIT = 25;

const filterChips = [
  { key: "todas", label: "Todas" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "service", label: "Servicio" },
  { key: "sin_interaccion", label: "Sin interacción" },
  { key: "meta", label: "Meta Ads" },
  { key: "direct", label: "Direct" },
  { key: "replay", label: "Con replay" },
];

const serviceLabels: Record<string, string> = {
  aire_acondicionado: "Aire acondicionado",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  suspension: "Suspensión",
  general: "General",
};

const eventLabels: Record<string, string> = {
  page_view_custom: "Página vista",
  service_click: "Click en servicio",
  whatsapp_click: "Click a WhatsApp",
};

const intentStyles: Record<string, string> = {
  Alta: "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100",
  Media: "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100",
  Baja: "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100",
};

function parsePositiveInt(value: string, fallback: number): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function labelValue(value: string | null | undefined) {
  if (!value) return "Sin dato";
  return serviceLabels[value] || eventLabels[value] || value.replaceAll("_", " ");
}

function cleanDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "Sin duración";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mainEventName(session: Session) {
  if (sessionHasEvent(session, "whatsapp_click")) return "whatsapp_click";
  if (sessionHasEvent(session, "service_click")) return "service_click";
  return "page_view_custom";
}

function hasWhatsApp(session: Session) {
  return sessionHasEvent(session, "whatsapp_click");
}

function hasReplay(session: Session) {
  return session.recording?.status === "available";
}

function buildHref(p: SessionParams, overrides: Partial<SessionParams>) {
  const next = { ...p, ...overrides };
  const q = new URLSearchParams();

  if (next.filter !== "todas") q.set("filter", next.filter);
  if (next.query) q.set("q", next.query);
  if (next.service) q.set("service", next.service);
  if (next.source) q.set("source", next.source);
  if (next.medium) q.set("medium", next.medium);
  if (next.content) q.set("content", next.content);
  if (next.event) q.set("event", next.event);
  if (next.campaign) q.set("campaign", next.campaign);
  if (next.limit !== DEFAULT_LIMIT) q.set("limit", String(next.limit));
  if (next.page > 1) q.set("page", String(next.page));

  const query = q.toString();
  return query ? `/sesiones?${query}` : "/sesiones";
}

function buildAdapterFilters(p: SessionParams): SessionFilters {
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

  adapterFilters.limit = p.limit + 1;
  adapterFilters.offset = (p.page - 1) * p.limit;

  return adapterFilters;
}

async function SessionsWorkspace({ p }: { p: SessionParams }) {
  const allSessions = await getAdapter().listSessions(DEFAULT_WORKSPACE_ID, buildAdapterFilters(p));

  const visible = allSessions.filter((session) => {
    const matchesSinInteraccion = p.filter !== "sin_interaccion" || session.events.length === 1;
    const matchesCampaign = !p.campaign || session.attribution.utm_campaign.toLowerCase() === p.campaign;
    return matchesSinInteraccion && matchesCampaign;
  });

  const hasNextPage = visible.length > p.limit;
  const display = visible.slice(0, p.limit);

  if (display.length === 0) {
    return (
      <div className="space-y-5">
        <SearchAndFilters p={p} rawQuery={p.query} />
        <EmptyState
          title="No hay sesiones con estos filtros"
          message="Cambia el filtro, borra la búsqueda o vuelve a todas las sesiones."
          action={<Link className="bf-control bg-white text-slate-700 hover:bg-slate-50" href="/sesiones">Limpiar filtros</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SessionHero sessions={display} page={p.page} />
      <SearchAndFilters p={p} rawQuery={p.query} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <SessionFeed sessions={display} p={p} hasNextPage={hasNextPage} />
        <SessionInsightPanel sessions={display} />
      </div>
    </div>
  );
}

function SessionHero({ sessions, page }: { sessions: Session[]; page: number }) {
  const visitors = new Set(sessions.map((session) => session.visitor_id)).size;
  const whatsapp = sessions.filter(hasWhatsApp).length;
  const replay = sessions.filter(hasReplay).length;

  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_58%,#eff6ff_100%)] p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_70px_-46px_rgba(15,23,42,0.5)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Explorador de sesiones</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-slate-950 md:text-[32px]">
            Qué hizo cada visitante antes de contactar
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revisa origen, servicio, eventos, campaña y replay sin convertir las señales anónimas en ventas o contactos confirmados.
          </p>
        </div>
        <div className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[12px] font-semibold text-blue-700 shadow-sm">
          Página {page}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <HeroMetric label="Sesiones visibles" value={sessions.length} detail="Según filtros activos" />
        <HeroMetric label="Visitantes" value={visitors} detail="IDs anónimos únicos" />
        <HeroMetric label="WhatsApp" value={whatsapp} detail="Señal de alta intención" tone="green" />
        <HeroMetric label="Con replay" value={replay} detail="Grabación disponible" tone="blue" />
      </div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "default" | "green" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "blue"
        ? "bg-blue-50 text-blue-700 ring-blue-100"
        : "bg-white/75 text-slate-800 ring-slate-200";

  return (
    <article className={`rounded-[16px] p-4 ring-1 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-[12px] leading-5 opacity-75">{detail}</p>
    </article>
  );
}

function SessionFeed({
  sessions,
  p,
  hasNextPage,
}: {
  sessions: Session[];
  p: SessionParams;
  hasNextPage: boolean;
}) {
  return (
    <section className="bf-apple-table">
      <div className="flex flex-wrap items-end justify-between gap-3 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#121827_0%,#1f2937_100%)] px-5 py-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.035em] text-white">Registro de sesiones</h2>
          <p className="mt-1 text-sm text-slate-500">Cada fila abre el perfil del visitante con esta sesión activa.</p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/10 px-3 text-[12px] font-semibold text-white">
          {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="bf-premium-table-body">
        {sessions.map((session) => (
          <SessionCard key={session.session_id} session={session} serviceFilter={p.service} />
        ))}
      </div>

      <PaginationFooter p={p} count={sessions.length} hasNextPage={hasNextPage} />
    </section>
  );
}

function SessionCard({ session, serviceFilter }: { session: Session; serviceFilter?: string }) {
  const hasRecording = hasReplay(session);
  const main = mainEventName(session);
  const includesFilteredService =
    serviceFilter &&
    session.service !== serviceFilter &&
    session.events.some((event) => event.service === serviceFilter);
  const intentClass = intentStyles[session.intent_level] || intentStyles.Baja;

  return (
    <article className="bf-apple-row group relative bg-transparent px-5 py-4">
      <Link
        href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
        aria-label={`Ver visitante ${shortId(session.visitor_id)}, sesión ${shortId(session.session_id)}`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none relative z-20 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.86fr)_170px] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ring-1 ${intentClass}`}>
              {session.intent_level} intención
            </span>
            <SourceBadge source={session.source} />
            <span className="bf-apple-pill font-mono">
              {shortId(session.session_id)}
            </span>
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-950">
              {labelValue(session.service)}
            </h3>
            <p className="min-w-0 truncate font-mono text-[12px] text-slate-500">{session.page_path}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {session.events.slice(0, 4).map((event) => (
              <span
                key={event.event_id}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                  event.event_name === "whatsapp_click"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : event.event_name === "service_click"
                      ? "bg-blue-50 text-blue-700 ring-blue-100"
                      : "bg-slate-50 text-slate-600 ring-slate-200"
                }`}
              >
                {eventLabels[event.event_name]}
              </span>
            ))}
            {session.events.length > 4 ? (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                +{session.events.length - 4} más
              </span>
            ) : null}
          </div>

          {includesFilteredService ? (
            <p className="mt-2 text-[12px] font-medium text-amber-700">
              Incluye eventos de {labelValue(serviceFilter)}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--apple-separator)] pt-3 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[12px]">
            <MiniField label="Visitante" value={shortId(session.visitor_id)} mono />
            <MiniField label="Duración" value={cleanDuration(session.duration)} mono />
            <MiniField label="Campaña" value={session.attribution.utm_campaign || "Sin campaña"} />
            <MiniField label="Anuncio" value={session.attribution.utm_content || session.attribution.ad_id || "Sin anuncio"} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 xl:flex-col xl:items-end">
          <div className="text-left xl:text-right">
            <p className="text-[12px] font-medium text-slate-500">{formatDateTime(session.timestamp)}</p>
            <p className="mt-1 text-[12px] text-slate-400">{eventLabels[main]}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {hasRecording ? (
              <Link
                href={`/visitantes/${session.visitor_id}?session=${session.session_id}&tab=grabaciones`}
                className="bf-apple-action pointer-events-auto relative z-30"
              >
                Ver replay
              </Link>
            ) : (
              <span className="bf-apple-secondary-action text-[var(--apple-tertiary-label)]">
                Sin replay
              </span>
            )}
            <Link
              href={`/visitantes/${session.visitor_id}?session=${session.session_id}`}
              className="bf-apple-secondary-action pointer-events-auto relative z-30"
            >
              Ver visitante
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function MiniField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function PaginationFooter({
  p,
  count,
  hasNextPage,
}: {
  p: SessionParams;
  count: number;
  hasNextPage: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 bg-[rgba(255,255,255,0.34)] px-5 py-4">
      <p className="text-sm text-slate-500">
        Página {p.page}, {count} sesión{count !== 1 ? "es" : ""}{hasNextPage ? ", hay más resultados" : ""}
      </p>
      <div className="flex items-center gap-2">
        {p.page > 1 ? (
          <Link href={buildHref(p, { page: p.page - 1 })} className="bf-control bg-white text-slate-700 hover:bg-slate-50">
            Anterior
          </Link>
        ) : (
          <span className="bf-control cursor-not-allowed bg-white text-slate-300">Anterior</span>
        )}
        {hasNextPage ? (
          <Link href={buildHref(p, { page: p.page + 1 })} className="bf-control bg-white text-slate-700 hover:bg-slate-50">
            Siguiente
          </Link>
        ) : (
          <span className="bf-control cursor-not-allowed bg-white text-slate-300">Siguiente</span>
        )}
      </div>
    </div>
  );
}

function SessionInsightPanel({ sessions }: { sessions: Session[] }) {
  const sourceEntries = countBy(sessions, (session) => session.source);
  const serviceEntries = countBy(sessions, (session) => labelValue(session.service));
  const whatsapp = sessions.filter(hasWhatsApp).length;
  const replay = sessions.filter(hasReplay).length;

  return (
    <aside className="space-y-4 xl:sticky xl:top-5">
      <section className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_22px_62px_-48px_rgba(15,23,42,0.48)]">
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">Lectura rápida</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Esta vista resume solo las sesiones cargadas en la página actual.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SideMetric label="WA" value={whatsapp} tone="green" />
          <SideMetric label="Replay" value={replay} tone="blue" />
        </div>
      </section>

      <BreakdownPanel title="Fuentes" entries={sourceEntries} total={sessions.length} />
      <BreakdownPanel title="Servicios" entries={serviceEntries} total={sessions.length} />

      <section className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <p className="text-[13px] font-semibold">Regla de lectura</p>
        <p className="mt-1 text-[12px] leading-5">
          WhatsApp es una conversión anónima de alta intención. No debe mostrarse como venta, revenue ni contacto confirmado.
        </p>
      </section>
    </aside>
  );
}

function SideMetric({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" }) {
  const toneClass = tone === "green" ? "text-emerald-700 bg-emerald-50 ring-emerald-100" : "text-blue-700 bg-blue-50 ring-blue-100";
  return (
    <div className={`rounded-[14px] p-3 ring-1 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold leading-none">{value}</p>
    </div>
  );
}

function BreakdownPanel({
  title,
  entries,
  total,
}: {
  title: string;
  entries: Array<[string, number]>;
  total: number;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_22px_62px_-48px_rgba(15,23,42,0.48)]">
      <h2 className="text-[16px] font-semibold tracking-[-0.025em] text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.slice(0, 5).map(([name, count]) => (
          <div key={name}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
              <span className="truncate font-medium text-slate-600">{name}</span>
              <span className="font-mono text-slate-500">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-800" style={{ width: `${Math.max(6, Math.round((count / total) * 100))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function countBy<T>(items: T[], getKey: (item: T) => string): Array<[string, number]> {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item) || "Sin dato";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function SessionsLoading() {
  return (
    <div className="space-y-5">
      <section className="animate-pulse rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-96 max-w-full rounded bg-slate-200" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-[16px] bg-slate-100" />
          ))}
        </div>
      </section>
      <section className="animate-pulse rounded-[22px] border border-slate-200 bg-white">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="border-b border-slate-100 p-5">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-4 h-14 rounded bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
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

  const p: SessionParams = { filter, query, service, source, medium, content, event, campaign, page, limit };

  return (
    <AppShell title="Sesiones" showPageHeader={false}>
      <Suspense fallback={<SessionsLoading />}>
        <SessionsWorkspace p={p} />
      </Suspense>
    </AppShell>
  );
}

function SearchAndFilters({ p, rawQuery }: { p: SessionParams; rawQuery: string }) {
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_58px_-46px_rgba(15,23,42,0.48)]">
      <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Buscar sesiones
          </span>
          <input
            name="q"
            defaultValue={rawQuery}
            placeholder="Visitante, sesión, servicio, campaña, anuncio o página"
            className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>
        <div className="flex items-end gap-2">
          <button className="h-11 rounded-[14px] bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
            Buscar
          </button>
          <Link href="/sesiones" className="inline-flex h-11 items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Limpiar
          </Link>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {filterChips.map((item) => (
          <FilterChip
            key={item.key}
            href={buildHref(p, { filter: item.key, page: 1 })}
            active={p.filter === item.key}
          >
            {item.label}
          </FilterChip>
        ))}
        {p.service ? <ActiveChip label={`Servicio: ${labelValue(p.service)}`} /> : null}
        {p.source ? <ActiveChip label={`Fuente: ${p.source}`} /> : null}
        {p.medium ? <ActiveChip label={`Medio: ${p.medium}`} /> : null}
        {p.content ? <ActiveChip label={`Anuncio: ${p.content === "__missing__" ? "Sin anuncio" : p.content}`} /> : null}
        {p.event ? <ActiveChip label={`Evento: ${labelValue(p.event)}`} /> : null}
        {p.campaign ? <ActiveChip label={`Campaña: ${p.campaign}`} /> : null}
      </div>
    </section>
  );
}

function ActiveChip({ label }: { label: string }) {
  return (
    <FilterChip href="/sesiones" tone="warning">
      {label} x
    </FilterChip>
  );
}
