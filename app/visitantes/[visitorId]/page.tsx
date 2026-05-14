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

  const activeTab = String(query.tab || "resumen");
  const summary = buildVisitorSummary(visitorSessions);
  const tabHref = (tab: string, sessionId = activeSession.session_id) =>
    `/visitantes/${visitorId}?session=${sessionId}${tab === "resumen" ? "" : `&tab=${tab}`}`;

  return (
    <AppShell
      title={`Visitor Intelligence: ${shortId(visitorId)}`}
      description="Expediente de comportamiento anónimo: sesiones, replay, journey, eventos, atribución y payload técnico."
    >
      <Link href="/sesiones" className="bf-control mb-4 bg-white text-slate-700 hover:bg-slate-50">
        Volver a sesiones
      </Link>

      <section className="bf-panel grid gap-2 p-3 md:grid-cols-3 xl:grid-cols-6">
        <HeaderStat label="Última actividad" value={formatDateTime(summary.last.timestamp)} />
        <HeaderStat label="Servicio principal" value={humanValue(summary.primaryService)} />
        <HeaderStat label="Fuente inicial" value={summary.firstSource} />
        <HeaderStat label="Última fuente" value={summary.lastSource} />
        <HeaderStat label="Último evento" value={eventLabels[summary.lastEvent]} />
        <HeaderStat label="Estado" value={summary.state} />
      </section>

      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`bf-chip ${
              activeTab === key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <section className="bf-defer mt-4">
        {activeTab === "resumen" ? <SummaryTab sessions={visitorSessions} activeSession={activeSession} visitorId={visitorId} /> : null}
        {activeTab === "grabaciones" ? <RecordingsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} /> : null}
        {activeTab === "journey" ? <JourneyTab sessions={visitorSessions} /> : null}
        {activeTab === "sesiones" ? <SessionsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} /> : null}
        {activeTab === "eventos" ? <EventsTab sessions={visitorSessions} activeSessionId={activeSession.session_id} /> : null}
        {activeTab === "atribucion" ? <AttributionTab session={activeSession} /> : null}
        {activeTab === "tecnico" ? <TechnicalTab session={activeSession} /> : null}
      </section>
    </AppShell>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryTab({ sessions, activeSession, visitorId }: { sessions: Session[]; activeSession: Session; visitorId: string }) {
  const importantEvents = sessions.flatMap((session) => session.events.filter((event) => event.event_name !== "page_view_custom")).slice(-4);
  const hasRecording = activeSession.recording?.status === "available";

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="bf-panel p-4">
        <h2 className="text-lg font-semibold text-slate-950">Qué sabemos</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este visitante tiene {sessions.length} sesiones registradas. La sesión seleccionada es{" "}
          <span title={activeSession.session_id} className="font-mono">{shortId(activeSession.session_id)}</span>,
          con origen {activeSession.source} y servicio {humanValue(activeSession.service)}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceBadge source={activeSession.source} />
          <StatusBadge label={`${activeSession.intent_level} intención`} />
          <StatusBadge label={hasRecording ? "Grabación disponible" : "Sin grabación"} />
        </div>
      </div>

      <div className="bf-panel p-4">
        <h2 className="text-lg font-semibold text-slate-950">Sesión seleccionada</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KeyValue label="Página" value={activeSession.page_path} />
          <KeyValue label="Campaña" value={activeSession.attribution.utm_campaign || "Sin campaña"} />
          <KeyValue label="Evento principal" value={mainEventLabel(activeSession)} />
          <KeyValue label="Duración" value={formatDuration(activeSession.duration)} />
        </div>
        {hasRecording ? (
          <Link href={`/visitantes/${visitorId}?session=${activeSession.session_id}&tab=grabaciones`} className="bf-control mt-4 border-slate-950 bg-slate-950 text-white hover:bg-slate-800">
            Abrir grabación
          </Link>
        ) : null}
      </div>

      <div className="bf-panel p-4 xl:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">Últimos eventos importantes</h2>
        <div className="mt-4 space-y-2">
          {importantEvents.length ? importantEvents.map((event) => (
            <div key={event.event_id} className="grid gap-2 rounded-md border border-slate-200 p-2.5 text-sm md:grid-cols-[180px_1fr_1fr]">
              <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
              <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
              <span className="text-slate-600">{event.cta_text || event.page_path}</span>
            </div>
          )) : <p className="text-sm text-slate-500">Solo página vista registrada.</p>}
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
      <div>{featured ? <ReplayPreview session={featured} /> : <div className="bf-panel p-4 text-sm text-slate-500">Este visitante no tiene grabaciones disponibles.</div>}</div>
      <div className="bf-panel p-4">
        <h2 className="text-lg font-semibold text-slate-950">Grabaciones del visitante</h2>
        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.session_id}
              href={`/visitantes/${visitorId}?session=${session.session_id}&tab=grabaciones`}
              className={`block rounded-md border p-2.5 ${session.session_id === activeSessionId ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950" title={session.session_id}>Sesión {shortId(session.session_id)}</p>
                <StatusBadge label={session.recording?.status === "available" ? "Grabación disponible" : "Sin grabación"} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{session.page_path} · {formatDuration(session.duration)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyTab({ sessions }: { sessions: Session[] }) {
  const steps: { key: string; title: string; timestamp: string; session: Session; detail?: string }[] = sessions.flatMap((session) => [
    { key: `${session.session_id}-entry`, title: `Entrada desde ${session.source}`, timestamp: session.timestamp, session },
    ...session.events.map((event) => ({ key: event.event_id, title: eventLabels[event.event_name], timestamp: event.timestamp, session, detail: event.cta_text })),
  ]);

  return (
    <div className="bf-panel p-4">
      <h2 className="text-lg font-semibold text-slate-950">Journey</h2>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div key={step.key} className="grid gap-3 rounded-md border border-slate-200 p-2.5 md:grid-cols-[44px_1fr_auto] md:items-center">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-800">{index + 1}</div>
            <div>
              <p className="font-medium text-slate-950">{step.title}</p>
              <p className="mt-1 text-sm text-slate-500" title={step.session.session_id}>
                Sesión {shortId(step.session.session_id)} · {step.session.page_path} · {step.detail || humanValue(step.session.service)}
              </p>
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(step.timestamp)}</p>
          </div>
        ))}
      </div>
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
          className={`bf-panel block p-3 ${session.session_id === activeSessionId ? "border-slate-900" : "border-slate-200"}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950" title={session.session_id}>Sesión {shortId(session.session_id)}</p>
            <SourceBadge source={session.source} />
            <StatusBadge label={mainEventLabel(session)} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{formatDateTime(session.timestamp)} · {session.page_path} · {humanValue(session.service)}</p>
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
        <h2 className="text-lg font-semibold text-slate-950">Técnico / debug</h2>
        <p className="mt-1 text-sm text-slate-500">Los nombres técnicos y payloads completos viven aquí para no dominar la experiencia principal.</p>
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
