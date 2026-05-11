import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buildVisitorSummary, getVisitor, getVisitorSessions, mainEventLabel } from "@/lib/analytics";
import { eventLabels, formatDateTime, humanField, humanValue, readableReferrer } from "@/lib/labels";

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
  ["atribucion", "Atribucion"],
  ["tecnico", "Tecnico"],
];

export default async function VisitorPage({ params, searchParams }: PageProps) {
  const { visitorId } = await params;
  const query = (await searchParams) || {};
  const visitor = getVisitor(visitorId);
  if (!visitor) notFound();

  const visitorSessions = getVisitorSessions(visitorId);
  const selectedSessionId = String(query.session || visitorSessions.at(-1)?.session_id || "");
  const activeSession = visitorSessions.find((session) => session.session_id === selectedSessionId) || visitorSessions.at(-1);
  if (!activeSession) notFound();

  const activeTab = String(query.tab || "resumen");
  const summary = buildVisitorSummary(visitorSessions);
  const tabHref = (tab: string, sessionId = activeSession.session_id) =>
    `/visitantes/${visitorId}?session=${sessionId}${tab === "resumen" ? "" : `&tab=${tab}`}`;

  return (
    <AppShell
      title={`Visitor Intelligence: ${visitorId}`}
      description="Expediente de comportamiento anonimo: sesiones, replay, journey, eventos, atribucion y payload tecnico."
    >
      <Link href="/sesiones" className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Volver a sesiones
      </Link>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-6">
        <HeaderStat label="Ultima actividad" value={formatDateTime(summary.last.timestamp)} />
        <HeaderStat label="Servicio principal" value={humanValue(summary.primaryService)} />
        <HeaderStat label="Fuente inicial" value={summary.firstSource} />
        <HeaderStat label="Ultima fuente" value={summary.lastSource} />
        <HeaderStat label="Ultimo evento" value={eventLabels[summary.lastEvent]} />
        <HeaderStat label="Estado" value={summary.state} />
      </section>

      <nav className="mt-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              activeTab === key ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <section className="mt-5">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryTab({ sessions, activeSession, visitorId }: { sessions: ReturnType<typeof getVisitorSessions>; activeSession: ReturnType<typeof getVisitorSessions>[number]; visitorId: string }) {
  const importantEvents = sessions.flatMap((session) => session.events.filter((event) => event.event_name !== "page_view_custom")).slice(-4);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Que sabemos</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este visitante tiene {sessions.length} sesiones registradas. La sesion seleccionada es {activeSession.session_id}, con origen {activeSession.source} y servicio {humanValue(activeSession.service)}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceBadge source={activeSession.source} />
          <StatusBadge label={`${activeSession.intent_level} intencion`} />
          <StatusBadge label={activeSession.recording.available ? "Grabacion disponible" : "Sin grabacion"} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Sesion seleccionada</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KeyValue label="Pagina" value={activeSession.page_path} />
          <KeyValue label="Campana" value={activeSession.attribution.utm_campaign || "Sin campana"} />
          <KeyValue label="Evento principal" value={mainEventLabel(activeSession)} />
          <KeyValue label="Duracion" value={activeSession.duration} />
        </div>
        {activeSession.recording.available ? (
          <Link href={`/visitantes/${visitorId}?session=${activeSession.session_id}&tab=grabaciones`} className="mt-4 inline-flex rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white">
            Abrir grabacion
          </Link>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="text-lg font-semibold text-slate-950">Ultimos eventos importantes</h2>
        <div className="mt-4 space-y-2">
          {importantEvents.length ? importantEvents.map((event) => (
            <div key={event.event_id} className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm md:grid-cols-[180px_1fr_1fr]">
              <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
              <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
              <span className="text-slate-600">{event.cta_text || event.page_path}</span>
            </div>
          )) : <p className="text-sm text-slate-500">Solo pagina vista registrada.</p>}
        </div>
      </div>
    </div>
  );
}

function RecordingsTab({ sessions, visitorId, activeSessionId }: { sessions: ReturnType<typeof getVisitorSessions>; visitorId: string; activeSessionId: string }) {
  const featured = sessions.find((session) => session.session_id === activeSessionId && session.recording.available) || sessions.find((session) => session.recording.available);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <div>{featured ? <ReplayPreview session={featured} /> : <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Este visitante no tiene grabaciones disponibles.</div>}</div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Grabaciones del visitante</h2>
        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.session_id}
              href={`/visitantes/${visitorId}?session=${session.session_id}&tab=grabaciones`}
              className={`block rounded-lg border p-3 ${session.session_id === activeSessionId ? "border-cyan-300 bg-cyan-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Sesion {session.session_id}</p>
                <StatusBadge label={session.recording.available ? "Grabacion disponible" : "Sin grabacion"} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{session.page_path} · {session.duration}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyTab({ sessions }: { sessions: ReturnType<typeof getVisitorSessions> }) {
  const steps: { key: string; title: string; timestamp: string; session: (typeof sessions)[number]; detail?: string }[] = sessions.flatMap((session) => [
    { key: `${session.session_id}-entry`, title: `Entrada desde ${session.source}`, timestamp: session.timestamp, session },
    ...session.events.map((event) => ({ key: event.event_id, title: eventLabels[event.event_name], timestamp: event.timestamp, session, detail: event.cta_text })),
  ]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Journey</h2>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div key={step.key} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[48px_1fr_auto] md:items-center">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-800">{index + 1}</div>
            <div>
              <p className="font-medium text-slate-950">{step.title}</p>
              <p className="mt-1 text-sm text-slate-500">Sesion {step.session.session_id} · {step.session.page_path} · {step.detail || humanValue(step.session.service)}</p>
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(step.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsTab({ sessions, visitorId, activeSessionId }: { sessions: ReturnType<typeof getVisitorSessions>; visitorId: string; activeSessionId: string }) {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link
          key={session.session_id}
          href={`/visitantes/${visitorId}?session=${session.session_id}&tab=sesiones`}
          className={`block rounded-lg border bg-white p-4 shadow-sm ${session.session_id === activeSessionId ? "border-cyan-300" : "border-slate-200"}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">Sesion {session.session_id}</p>
            <SourceBadge source={session.source} />
            <StatusBadge label={mainEventLabel(session)} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{formatDateTime(session.timestamp)} · {session.page_path} · {humanValue(session.service)}</p>
        </Link>
      ))}
    </div>
  );
}

function EventsTab({ sessions, activeSessionId }: { sessions: ReturnType<typeof getVisitorSessions>; activeSessionId: string }) {
  const activeEvents = sessions.flatMap((session) => session.events).filter((event) => event.session_id === activeSessionId);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">Sesion activa: {activeSessionId}</div>
      {activeEvents.map((event) => (
        <div key={event.event_id} className="grid gap-3 border-b border-slate-100 p-4 text-sm md:grid-cols-[180px_1fr_1fr_1fr]">
          <span className="text-slate-500">{formatDateTime(event.timestamp)}</span>
          <span className="font-medium text-slate-950">{eventLabels[event.event_name]}</span>
          <span className="text-slate-600">{event.page_path}</span>
          <span className="text-slate-600">{event.cta_text || "n/a"}</span>
        </div>
      ))}
    </div>
  );
}

function AttributionTab({ session }: { session: ReturnType<typeof getVisitorSessions>[number] }) {
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

function TechnicalTab({ session }: { session: ReturnType<typeof getVisitorSessions>[number] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Tecnico / debug</h2>
        <p className="mt-1 text-sm text-slate-500">Los nombres tecnicos y payloads completos viven aqui para no dominar la experiencia principal.</p>
      </div>
      <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-5 text-xs leading-5 text-slate-100 shadow-sm">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
