export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import type { Session } from "@/lib/data/types";
import { buildVisitorSummary, mainEventLabel } from "@/lib/analytics";
import { eventLabels, formatDateTime, formatDuration, humanField, humanValue, readableReferrer, shortId } from "@/lib/labels";

type PageProps = {
  params: Promise<{ visitorId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = [
  ["resumen", "Resumen"],
  ["grabaciones", "Grabaciones"],
  ["journey", "Journey"],
  ["sesiones", "Sesiones"],
  ["eventos", "Eventos"],
  ["atribucion", "Atribución"],
  ["tecnico", "Técnico"],
];

const intentRank: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };

export default async function VisitorPage({ params, searchParams }: PageProps) {
  const { visitorId } = await params;
  const query = (await searchParams) || {};

  const adapter = getAdapter();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [visitor, visitorSessions] = await Promise.all([
    adapter.getVisitorProfile(workspaceId, visitorId),
    adapter.getVisitorSessions(workspaceId, visitorId),
  ]);

  if (!visitor && visitorSessions.length === 0) notFound();

  const selectedSessionId = String(query.session || visitorSessions.at(-1)?.session_id || "");
  const activeSession = visitorSessions.find((s) => s.session_id === selectedSessionId) || visitorSessions.at(-1);
  if (!activeSession) notFound();

  const knownTabs = tabs.map(([key]) => key);
  const rawTab = String(query.tab || "resumen");
  const activeTab = knownTabs.includes(rawTab) ? rawTab : "resumen";
  const summary = buildVisitorSummary(visitorSessions);

  // KPIs computed from sessions
  const waClicks = visitorSessions.reduce(
    (acc, s) => acc + s.events.filter((e) => e.event_name === "whatsapp_click").length,
    0
  );
  const servicesViewed = new Set(visitorSessions.map((s) => s.service)).size;
  const recordingsCount = visitorSessions.filter((s) => s.recording?.status === "available").length;
  const maxIntent = visitorSessions.reduce<string>((best, s) => {
    return (intentRank[s.intent_level] ?? 0) > (intentRank[best] ?? 0) ? s.intent_level : best;
  }, "Baja");

  const tabHref = (tab: string, sessionId = activeSession.session_id) =>
    `/visitantes/${visitorId}?session=${sessionId}${tab === "resumen" ? "" : `&tab=${tab}`}`;

  return (
    <AppShell title="Visitor Intelligence">
      <Link href="/sesiones" className="bf-control mb-5 bg-white text-slate-600 hover:bg-slate-50">
        ← Sesiones
      </Link>

      {/* Expediente header */}
      <div className="bf-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Visitante anónimo
            </p>
            <h2 className="mt-1.5 font-mono text-xl font-semibold text-slate-950">
              {shortId(visitorId)}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{visitorId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={`${maxIntent} intención`} />
            <SourceBadge source={summary.firstSource} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
          <span>Última actividad: <span className="text-slate-800">{formatDateTime(summary.last.timestamp)}</span></span>
          <span>Servicio principal: <span className="text-slate-800">{humanValue(summary.primaryService)}</span></span>
          <span>Fuente inicial: <span className="text-slate-800">{summary.firstSource}</span></span>
          <span>Estado: <span className="text-slate-800">{summary.state}</span></span>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <KpiCard label="Sesiones" value={visitorSessions.length} />
        <KpiCard label="WA clicks" value={waClicks} note="señal de intención" />
        <KpiCard label="Servicios vistos" value={servicesViewed} />
        <KpiCard label="Grabaciones" value={recordingsCount} />
      </div>

      {/* Tabs */}
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`bf-chip ${
              activeTab === key
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <section className="bf-defer mt-4">
        {activeTab === "resumen" ? (
          <SummaryTab sessions={visitorSessions} activeSession={activeSession} visitorId={visitorId} />
        ) : null}
        {activeTab === "grabaciones" ? (
          <RecordingsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        ) : null}
        {activeTab === "journey" ? <JourneyTab sessions={visitorSessions} visitorId={visitorId} /> : null}
        {activeTab === "sesiones" ? (
          <SessionsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        ) : null}
        {activeTab === "eventos" ? (
          <EventsTab sessions={visitorSessions} activeSessionId={activeSession.session_id} />
        ) : null}
        {activeTab === "atribucion" ? <AttributionTab session={activeSession} /> : null}
        {activeTab === "tecnico" ? <TechnicalTab session={activeSession} /> : null}
      </section>
    </AppShell>
  );
}

function KpiCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}

function SummaryTab({ sessions, activeSession, visitorId }: { sessions: Session[]; activeSession: Session; visitorId: string }) {
  const importantEvents = sessions
    .flatMap((s) => s.events.filter((e) => e.event_name !== "page_view_custom"))
    .slice(-4);
  const hasRecording = activeSession.recording?.status === "available";

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="bf-panel p-4">
        <h2 className="text-base font-semibold text-slate-950">Qué sabemos</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este visitante tiene {sessions.length} sesión{sessions.length !== 1 ? "es" : ""} registrada{sessions.length !== 1 ? "s" : ""}.
          La sesión seleccionada{" "}
          <span className="font-mono" title={activeSession.session_id}>{shortId(activeSession.session_id)}</span>{" "}
          llegó desde {activeSession.source} e interactuó con {humanValue(activeSession.service)}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceBadge source={activeSession.source} />
          <StatusBadge label={`${activeSession.intent_level} intención`} />
          <StatusBadge label={hasRecording ? "Grabación disponible" : "Sin grabación"} />
        </div>
      </div>

      <div className="bf-panel p-4">
        <h2 className="text-base font-semibold text-slate-950">Sesión seleccionada</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KeyValue label="Página" value={activeSession.page_path} />
          <KeyValue label="Campaña" value={activeSession.attribution.utm_campaign || "Sin campaña"} />
          <KeyValue label="Evento principal" value={mainEventLabel(activeSession)} />
          <KeyValue label="Duración" value={formatDuration(activeSession.duration)} />
        </div>
        {hasRecording ? (
          <Link
            href={`/visitantes/${visitorId}?session=${activeSession.session_id}&tab=grabaciones`}
            className="bf-control mt-4 border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
          >
            Ver grabación
          </Link>
        ) : null}
      </div>

      <div className="bf-panel p-4 xl:col-span-2">
        <h2 className="text-base font-semibold text-slate-950">Últimos eventos de intención</h2>
        <div className="mt-4 space-y-2">
          {importantEvents.length ? (
            importantEvents.map((event) => (
              <div
                key={event.event_id}
                className="grid gap-2 rounded-md border border-slate-200 p-2.5 text-sm md:grid-cols-[180px_1fr_1fr]"
              >
                <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
                <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
                <span className="text-slate-600">{event.cta_text || event.page_path}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Solo página vista registrada en esta sesión.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordingsTab({ sessions, visitorId, activeSessionId }: { sessions: Session[]; visitorId: string; activeSessionId: string }) {
  const featured =
    sessions.find((s) => s.session_id === activeSessionId && s.recording?.status === "available") ||
    sessions.find((s) => s.recording?.status === "available");

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <div>
        {featured ? (
          <ReplayPreview session={featured} />
        ) : (
          <div className="bf-panel p-4 text-sm text-slate-500">
            Este visitante no tiene grabaciones disponibles.
          </div>
        )}
      </div>
      <div className="bf-panel p-4">
        <h2 className="text-base font-semibold text-slate-950">Grabaciones del visitante</h2>
        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.session_id}
              href={`/visitantes/${visitorId}?session=${session.session_id}&tab=grabaciones`}
              className={`block rounded-md border p-2.5 ${
                session.session_id === activeSessionId
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950" title={session.session_id}>
                  Sesión {shortId(session.session_id)}
                </p>
                <StatusBadge
                  label={session.recording?.status === "available" ? "Grabación" : "Sin replay"}
                />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {session.page_path} · {formatDuration(session.duration)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const eventDot: Record<string, string> = {
  whatsapp_click: "bg-emerald-500",
  service_click: "bg-blue-500",
  page_view_custom: "bg-slate-300",
};

function JourneyTab({ sessions, visitorId }: { sessions: Session[]; visitorId: string }) {
  return (
    <div className="space-y-4">
      {sessions.map((session, idx) => {
        const hasRecording = session.recording?.status === "available";
        return (
          <div key={session.session_id} className="bf-panel overflow-hidden">
            {/* Session header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Sesión{" "}
                    <span className="font-mono font-normal text-slate-500">{shortId(session.session_id)}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(session.timestamp)} · {session.source} · {formatDuration(session.duration)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={session.source} />
                <StatusBadge label={`${session.intent_level} intención`} />
                {hasRecording && (
                  <Link
                    href={`/visitantes/${visitorId}?session=${session.session_id}&tab=grabaciones`}
                    className="bf-chip border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Ver replay
                  </Link>
                )}
              </div>
            </div>

            {/* Campaign context */}
            {session.attribution.utm_campaign && (
              <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                Campaña: <span className="font-medium text-slate-700">{session.attribution.utm_campaign}</span>
                {session.attribution.utm_medium && ` · ${session.attribution.utm_medium}`}
              </div>
            )}

            {/* Events */}
            <div className="divide-y divide-slate-100 px-4">
              {session.events.map((event) => (
                <div key={event.event_id} className="flex items-start gap-3 py-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${eventDot[event.event_name] ?? "bg-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-950">{eventLabels[event.event_name]}</span>
                    {event.cta_text && (
                      <span className="ml-2 text-sm text-slate-500">&ldquo;{event.cta_text}&rdquo;</span>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">{session.page_path}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SessionsTab({ sessions, visitorId, activeSessionId }: { sessions: Session[]; visitorId: string; activeSessionId: string }) {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link
          key={session.session_id}
          href={`/visitantes/${visitorId}?session=${session.session_id}&tab=sesiones`}
          className={`bf-panel block p-3 transition hover:border-slate-300 ${
            session.session_id === activeSessionId ? "border-slate-900" : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950" title={session.session_id}>
              Sesión {shortId(session.session_id)}
            </p>
            <SourceBadge source={session.source} />
            <StatusBadge label={mainEventLabel(session)} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {formatDateTime(session.timestamp)} · {session.page_path} · {humanValue(session.service)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function EventsTab({ sessions, activeSessionId }: { sessions: Session[]; activeSessionId: string }) {
  const activeEvents = sessions.flatMap((s) => s.events).filter((e) => e.session_id === activeSessionId);

  return (
    <div className="bf-panel overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800" title={activeSessionId}>
        Sesión activa: {shortId(activeSessionId)}
      </div>
      {activeEvents.map((event) => (
        <div key={event.event_id} className="bf-row grid gap-3 px-3 py-2.5 text-sm md:grid-cols-[180px_1fr_1fr_1fr]">
          <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
          <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
          <span className="text-slate-600">{event.page_path}</span>
          <span className="text-slate-600">{event.cta_text || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}

function AttributionTab({ session }: { session: Session }) {
  const fields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "referrer"];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KeyValue label="Fuente" value={session.source} />
      <KeyValue label="Referencia" value={readableReferrer(session.attribution.referrer)} />
      {fields.map((field) => (
        <KeyValue key={field} label={humanField(field)} value={session.attribution[field as keyof typeof session.attribution] || "n/a"} />
      ))}
    </div>
  );
}

function TechnicalTab({ session }: { session: Session }) {
  return (
    <div className="space-y-4">
      <div className="bf-panel p-4">
        <h2 className="text-base font-semibold text-slate-950">Técnico / debug</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nombres técnicos y payloads completos. No domina la experiencia principal.
        </p>
      </div>
      <pre className="overflow-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100 shadow-sm">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bf-panel p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
