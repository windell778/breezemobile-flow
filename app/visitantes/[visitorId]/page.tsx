export const dynamic = "force-dynamic";

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { VisitorTabShell } from "@/components/visitors/VisitorTabShell";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import type { EventName, Session, Source, Visitor } from "@/lib/data/types";
import { formatDateTime, readableReferrer, shortId } from "@/lib/labels";

type PageProps = {
  params: Promise<{ visitorId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const tabs: Array<[string, string]> = [
  ["resumen", "Resumen"],
  ["grabaciones", "Grabaciones"],
  ["journey", "Journey"],
  ["sesiones", "Sesiones"],
  ["eventos", "Eventos"],
  ["atribucion", "Atribución"],
  ["tecnico", "Técnico"],
];

const serviceLabels: Record<string, string> = {
  aire_acondicionado: "Aire acondicionado",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  suspension: "Suspensión",
  general: "General",
};

const eventLabels: Record<EventName, string> = {
  page_view_custom: "Página vista",
  service_click: "Click en servicio",
  whatsapp_click: "Click a WhatsApp",
};

const intentRank: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };

const VISITOR_INTELLIGENCE_CACHE_SECONDS = 60;

const intentTone: Record<string, string> = {
  Alta: "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100",
  Media: "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100",
  Baja: "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100",
};

const eventTone: Record<EventName, string> = {
  page_view_custom: "bg-slate-100 text-slate-600 ring-slate-200",
  service_click: "bg-blue-50 text-blue-700 ring-blue-100",
  whatsapp_click: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const eventDot: Record<EventName, string> = {
  page_view_custom: "bg-slate-300",
  service_click: "bg-blue-500",
  whatsapp_click: "bg-emerald-500",
};

function serviceLabel(value: string | null | undefined) {
  if (!value) return "Sin dato";
  return serviceLabels[value] || value.replaceAll("_", " ");
}

function cleanDuration(seconds: number | null | undefined) {
  if (seconds == null) return "Sin duración";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mainEventName(session: Session): EventName {
  if (session.events.some((event) => event.event_name === "whatsapp_click")) return "whatsapp_click";
  if (session.events.some((event) => event.event_name === "service_click")) return "service_click";
  return "page_view_custom";
}

function maxIntent(sessions: Session[]) {
  return sessions.reduce<string>((best, session) => {
    return (intentRank[session.intent_level] || 0) > (intentRank[best] || 0) ? session.intent_level : best;
  }, "Baja");
}

function primaryService(sessions: Session[]) {
  const counts = countBy(sessions, (session) => serviceLabel(session.service));
  return counts[0]?.[0] || "Sin dato";
}

function firstSource(sessions: Session[]): Source {
  return sessions[0]?.source || "Direct";
}

function lastSource(sessions: Session[]): Source {
  return sessions.at(-1)?.source || "Direct";
}

function hasReplay(session: Session) {
  return session.recording?.status === "available";
}

function uniqueServices(sessions: Session[]) {
  return new Set(sessions.map((session) => session.service)).size;
}

function tabHref(visitorId: string, tab: string, sessionId: string) {
  const tabQuery = tab === "resumen" ? "" : `&tab=${tab}`;
  return `/visitantes/${visitorId}?session=${sessionId}${tabQuery}`;
}

async function fetchVisitorIntelligenceData(workspaceId: string, visitorId: string) {
  const adapter = getAdapter();
  return unstable_cache(
    async (): Promise<{ visitor: Visitor | null; visitorSessions: Session[] }> => {
      const [visitor, visitorSessions] = await Promise.all([
        adapter.getVisitorProfile(workspaceId, visitorId),
        adapter.getVisitorSessions(workspaceId, visitorId),
      ]);

      return { visitor, visitorSessions };
    },
    ["visitor-intelligence", workspaceId, visitorId],
    {
      revalidate: VISITOR_INTELLIGENCE_CACHE_SECONDS,
      tags: [`visitor-intelligence:${workspaceId}:${visitorId}`],
    }
  )();
}

export default async function VisitorPage({ params, searchParams }: PageProps) {
  const { visitorId } = await params;
  const query = (await searchParams) || {};

  const workspaceId = DEFAULT_WORKSPACE_ID;
  const { visitor, visitorSessions } = await fetchVisitorIntelligenceData(workspaceId, visitorId);

  if (!visitor && visitorSessions.length === 0) notFound();

  const selectedSessionId = String(query.session || visitorSessions.at(-1)?.session_id || "");
  const activeSession = visitorSessions.find((session) => session.session_id === selectedSessionId) || visitorSessions.at(-1);
  if (!activeSession) notFound();

  const knownTabs = tabs.map(([key]) => key);
  const rawTab = String(query.tab || "resumen");
  const activeTab = knownTabs.includes(rawTab) ? rawTab : "resumen";
  const intent = maxIntent(visitorSessions);
  const waClicks = visitorSessions.reduce(
    (acc, session) => acc + session.events.filter((event) => event.event_name === "whatsapp_click").length,
    0
  );
  const recordingsCount = visitorSessions.filter(hasReplay).length;

  return (
    <AppShell title="Visitor Intelligence" showPageHeader={false}>
      <VisitorTabShell
        tabs={tabs}
        initialTab={activeTab}
        visitorId={visitorId}
        activeSessionId={activeSession.session_id}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_50px_-46px_rgba(15,23,42,0.5)]">
          <Link href="/sesiones" className="inline-flex h-9 items-center rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Volver a sesiones
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-semibold text-slate-950">{shortId(visitorId)}</span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="font-mono text-slate-500">{shortId(activeSession.session_id)}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ring-1 ${intentTone[intent] || intentTone.Baja}`}>
              {intent} intención
            </span>
            <SourceBadge source={lastSource(visitorSessions)} />
          </div>
        </div>

        <section data-visitor-tab-panel="resumen" className="bf-defer">
            <SummaryTab
              sessions={visitorSessions}
              activeSession={activeSession}
              visitorId={visitorId}
              intent={intent}
              waClicks={waClicks}
              recordingsCount={recordingsCount}
            />
        </section>
        <section data-visitor-tab-panel="grabaciones" className="bf-defer">
            <RecordingsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        </section>
        <section data-visitor-tab-panel="journey" className="bf-defer">
          <JourneyTab sessions={visitorSessions} visitorId={visitorId} />
        </section>
        <section data-visitor-tab-panel="sesiones" className="bf-defer">
            <SessionsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        </section>
        <section data-visitor-tab-panel="eventos" className="bf-defer">
            <EventsTab sessions={visitorSessions} activeSessionId={activeSession.session_id} />
        </section>
        <section data-visitor-tab-panel="atribucion" className="bf-defer">
          <AttributionTab session={activeSession} />
        </section>
        <section data-visitor-tab-panel="tecnico" className="bf-defer">
          <TechnicalTab session={activeSession} />
        </section>
      </VisitorTabShell>
    </AppShell>
  );
}

function ProfileMetric({
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      <p className="mt-1 truncate text-[12px] leading-5 opacity-75">{detail}</p>
    </article>
  );
}

function ActiveSessionCard({ activeSession }: { activeSession: Session }) {
  return (
    <aside className="rounded-[20px] border border-slate-200 bg-white/85 p-4 shadow-[0_14px_42px_-36px_rgba(15,23,42,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sesión activa</p>
          <p className="mt-2 font-mono text-lg font-semibold text-slate-950" title={activeSession.session_id}>
            {shortId(activeSession.session_id)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${eventTone[mainEventName(activeSession)]}`}>
          {eventLabels[mainEventName(activeSession)]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <CompactField label="Página" value={activeSession.page_path} />
        <CompactField label="Servicio" value={serviceLabel(activeSession.service)} />
        <CompactField label="Duración" value={cleanDuration(activeSession.duration)} />
        <CompactField label="Replay" value={hasReplay(activeSession) ? "Disponible" : "Sin replay"} />
      </div>
      <p className="mt-4 text-[12px] leading-5 text-slate-500">
        {formatDateTime(activeSession.timestamp)}
      </p>
    </aside>
  );
}

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-slate-700">{value}</p>
    </div>
  );
}

function SummaryTab({
  sessions,
  activeSession,
  visitorId,
  intent,
  waClicks,
  recordingsCount,
}: {
  sessions: Session[];
  activeSession: Session;
  visitorId: string;
  intent: string;
  waClicks: number;
  recordingsCount: number;
}) {
  const importantEvents = sessions
    .flatMap((session) => session.events.filter((event) => event.event_name !== "page_view_custom"))
    .slice(-5)
    .reverse();
  const sourceEntries = countBy(sessions, (session) => session.source);
  const serviceEntries = countBy(sessions, (session) => serviceLabel(session.service));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_56%,#eef6ff_100%)] shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_74px_-48px_rgba(15,23,42,0.55)]">
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ring-1 ${intentTone[intent] || intentTone.Baja}`}>
                {intent} intención
              </span>
              <SourceBadge source={lastSource(sessions)} />
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                Visitante anónimo
              </span>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Resumen</p>
              <h1 className="mt-2 font-mono text-[28px] font-semibold tracking-[-0.055em] text-slate-950 md:text-[38px]">
                {shortId(visitorId)}
              </h1>
              <p className="mt-2 max-w-3xl break-all font-mono text-[12px] leading-5 text-slate-500">{visitorId}</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <ProfileMetric label="Sesiones" value={sessions.length} detail="registradas" />
              <ProfileMetric label="WhatsApp" value={waClicks} detail="alta intención" tone="green" />
              <ProfileMetric label="Servicios" value={uniqueServices(sessions)} detail={primaryService(sessions)} />
              <ProfileMetric label="Replays" value={recordingsCount} detail="disponibles" tone="blue" />
            </div>
          </div>

          <ActiveSessionCard activeSession={activeSession} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
        <Panel title="Resumen del visitante" subtitle="Lectura operativa basada en sesiones y eventos reales.">
          <div className="grid gap-3 md:grid-cols-2">
            <InsightTile label="Primera fuente" value={firstSource(sessions)} />
            <InsightTile label="Última fuente" value={lastSource(sessions)} />
            <InsightTile label="Servicio principal" value={primaryService(sessions)} />
            <InsightTile label="Última actividad" value={formatDateTime(activeSession.timestamp)} />
          </div>
          <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">Regla de interpretación</p>
            <p className="mt-1 text-[13px] leading-5">
              WhatsApp es una señal anónima de alta intención. No confirma venta, revenue ni contacto calificado.
            </p>
          </div>
        </Panel>

        <Panel title="Eventos recientes de intención" subtitle="Eventos más importantes fuera de página vista.">
          {importantEvents.length ? (
            <div className="divide-y divide-slate-100">
              {importantEvents.map((event) => (
                <EventLine key={event.event_id} event={event} active={event.session_id === activeSession.session_id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No hay eventos de intención registrados todavía.</p>
          )}
        </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Contexto" subtitle="Distribución compacta de este visitante.">
            <Breakdown title="Fuentes" entries={sourceEntries} total={sessions.length} />
            <div className="mt-5">
              <Breakdown title="Servicios" entries={serviceEntries} total={sessions.length} />
            </div>
          </Panel>
          <Panel title="Saltos rápidos" subtitle="Misma sesión activa, otra lectura.">
            <div className="flex flex-col gap-2">
              <Link href={tabHref(visitorId, "grabaciones", activeSession.session_id)} className="inline-flex h-10 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Ver grabaciones
              </Link>
              <Link href={tabHref(visitorId, "eventos", activeSession.session_id)} className="inline-flex h-10 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Ver eventos
              </Link>
              <Link href={tabHref(visitorId, "tecnico", activeSession.session_id)} className="inline-flex h-10 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Ver técnico
              </Link>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function RecordingsTab({ sessions, visitorId, activeSessionId }: { sessions: Session[]; visitorId: string; activeSessionId: string }) {
  const featured =
    sessions.find((session) => session.session_id === activeSessionId && hasReplay(session)) ||
    sessions.find(hasReplay);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        {featured ? (
          <ReplayPreview session={featured} />
        ) : (
          <Panel title="Sin grabación disponible" subtitle="Este visitante todavía no tiene replay asociado.">
            <p className="text-sm leading-6 text-slate-500">
              La sesión puede seguir siendo útil por eventos, atribución y página visitada.
            </p>
          </Panel>
        )}
      </div>
      <Panel title="Sesiones grabadas" subtitle="Cambia la sesión activa sin salir del visitante.">
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionPicker
              key={session.session_id}
              session={session}
              visitorId={visitorId}
              active={session.session_id === activeSessionId}
              tab="grabaciones"
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function JourneyTab({ sessions, visitorId }: { sessions: Session[]; visitorId: string }) {
  return (
    <div className="space-y-4">
      {sessions.map((session, index) => (
        <section key={session.session_id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_54px_-48px_rgba(15,23,42,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 font-mono text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-950" title={session.session_id}>Sesión {shortId(session.session_id)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(session.timestamp)} · {cleanDuration(session.duration)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={session.source} />
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ring-1 ${intentTone[session.intent_level] || intentTone.Baja}`}>
                {session.intent_level} intención
              </span>
              {hasReplay(session) ? (
                <Link href={tabHref(visitorId, "grabaciones", session.session_id)} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100">
                  Ver replay
                </Link>
              ) : null}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="mb-3 grid gap-3 text-sm md:grid-cols-3">
              <CompactInfo label="Página" value={session.page_path} />
              <CompactInfo label="Servicio" value={serviceLabel(session.service)} />
              <CompactInfo label="Campaña" value={session.attribution.utm_campaign || "Sin campaña"} />
            </div>
            <div className="divide-y divide-slate-100">
              {session.events.map((event) => (
                <EventLine key={event.event_id} event={event} active={false} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function SessionsTab({ sessions, visitorId, activeSessionId }: { sessions: Session[]; visitorId: string; activeSessionId: string }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {sessions.map((session) => (
        <SessionPicker
          key={session.session_id}
          session={session}
          visitorId={visitorId}
          active={session.session_id === activeSessionId}
          tab="sesiones"
          expanded
        />
      ))}
    </div>
  );
}

function EventsTab({ sessions, activeSessionId }: { sessions: Session[]; activeSessionId: string }) {
  const activeEvents = sessions.flatMap((session) => session.events).filter((event) => event.session_id === activeSessionId);

  return (
    <Panel title={`Eventos de sesión ${shortId(activeSessionId)}`} subtitle="Solo se muestran los eventos de la sesión activa.">
      <div className="divide-y divide-slate-100">
        {activeEvents.map((event) => (
          <EventLine key={event.event_id} event={event} active />
        ))}
      </div>
    </Panel>
  );
}

function AttributionTab({ session }: { session: Session }) {
  const fields: Array<[string, string]> = [
    ["Fuente", session.source],
    ["Medio", session.attribution.utm_medium],
    ["Campaña", session.attribution.utm_campaign],
    ["Anuncio / Creativo", session.attribution.utm_content],
    ["Término", session.attribution.utm_term],
    ["ID de campaña", session.attribution.campaign_id],
    ["ID de conjunto", session.attribution.adset_id],
    ["ID de anuncio", session.attribution.ad_id],
    ["Referencia", readableReferrer(session.attribution.referrer)],
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Atribución de la sesión activa" subtitle="UTMs y parámetros asociados a esta sesión, no al visitante completo.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fields.map(([label, value]) => (
            <InsightTile key={label} label={label} value={value || "Sin dato"} />
          ))}
        </div>
      </Panel>
      <Panel title="Regla de atribución" subtitle="La atribución no se hereda entre sesiones.">
        <p className="text-sm leading-6 text-slate-600">
          Si una sesión llega directa u orgánica, debe mostrarse así. No debe tomar la campaña pagada de una sesión anterior.
        </p>
      </Panel>
    </div>
  );
}

function TechnicalTab({ session }: { session: Session }) {
  return (
    <div className="space-y-4">
      <Panel title="Datos técnicos" subtitle="IDs, nombres de campos y payload completo de la sesión activa.">
        <div className="grid gap-3 md:grid-cols-3">
          <InsightTile label="visitor_id" value={session.visitor_id} mono />
          <InsightTile label="session_id" value={session.session_id} mono />
          <InsightTile label="recording_id" value={session.recording?.recording_id || "Sin dato"} mono />
        </div>
      </Panel>
      <pre className="max-h-[720px] overflow-auto rounded-[18px] border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-100 shadow-sm">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_58px_-48px_rgba(15,23,42,0.5)]">
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InsightTile({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <article className="min-w-0 rounded-[15px] border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </article>
  );
}

function EventLine({
  event,
  active,
}: {
  event: Session["events"][number];
  active: boolean;
}) {
  return (
    <div className={`grid gap-3 py-3 text-sm md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_130px] ${active ? "bg-blue-50/35 px-3" : ""}`}>
      <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
      <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-950">
        <span className={`h-2 w-2 shrink-0 rounded-full ${eventDot[event.event_name]}`} />
        {eventLabels[event.event_name]}
      </span>
      <span className="min-w-0 truncate text-slate-600">{event.cta_text || event.page_path}</span>
      <span className="font-mono text-xs text-slate-400" title={event.event_id}>{shortId(event.event_id)}</span>
    </div>
  );
}

function SessionPicker({
  session,
  visitorId,
  active,
  tab,
  expanded = false,
}: {
  session: Session;
  visitorId: string;
  active: boolean;
  tab: string;
  expanded?: boolean;
}) {
  return (
    <Link
      href={tabHref(visitorId, tab, session.session_id)}
      className={`block rounded-[16px] border p-3 transition-[background-color,border-color,box-shadow,transform] duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-slate-50 ${
        active
          ? "border-slate-950 bg-slate-50 shadow-[0_12px_34px_-30px_rgba(15,23,42,0.65)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-slate-950" title={session.session_id}>
            {shortId(session.session_id)}
          </p>
          <p className="mt-1 truncate text-sm text-slate-600">{serviceLabel(session.service)} · {session.page_path}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${eventTone[mainEventName(session)]}`}>
          {eventLabels[mainEventName(session)]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceBadge source={session.source} />
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ring-1 ${intentTone[session.intent_level] || intentTone.Baja}`}>
          {session.intent_level}
        </span>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
          {hasReplay(session) ? "Con replay" : "Sin replay"}
        </span>
      </div>
      {expanded ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-slate-500">
          <CompactInfo label="Inicio" value={formatDateTime(session.timestamp)} />
          <CompactInfo label="Duración" value={cleanDuration(session.duration)} />
          <CompactInfo label="Campaña" value={session.attribution.utm_campaign || "Sin campaña"} />
          <CompactInfo label="Eventos" value={String(session.events.length)} />
        </div>
      ) : null}
    </Link>
  );
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[12px] bg-slate-50 p-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-slate-700">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  entries,
  total,
}: {
  title: string;
  entries: Array<[string, number]>;
  total: number;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-3 space-y-3">
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
    </div>
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
