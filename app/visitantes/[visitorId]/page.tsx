export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReplayPreview } from "@/components/ui/ReplayPreview";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IntentBadge } from "@/components/ui/IntentBadge";
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
  ["tecnico", "Datos técnicos"],
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

  const waClicks = visitorSessions.reduce(
    (acc, s) => acc + s.events.filter((e) => e.event_name === "whatsapp_click").length,
    0,
  );
  const servicesViewed = new Set(visitorSessions.map((s) => s.service)).size;
  const recordingsCount = visitorSessions.filter((s) => s.recording?.status === "available").length;
  const maxIntent = visitorSessions.reduce<string>((best, s) => {
    return (intentRank[s.intent_level] ?? 0) > (intentRank[best] ?? 0) ? s.intent_level : best;
  }, "Baja");

  const tabHref = (tab: string, sessionId = activeSession.session_id) =>
    `/visitantes/${visitorId}?session=${sessionId}${tab === "resumen" ? "" : `&tab=${tab}`}`;

  return (
    <AppShell>
      {/* Back link */}
      <Link
        href="/sesiones"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--color-text-2)" }}
      >
        ← Sesiones
      </Link>

      {/* Header sticky con KPIs + tabs */}
      <div
        className="mb-6 overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {/* Fila 1: ID + KPIs */}
        <div
          className="flex flex-wrap items-center gap-6 border-b px-5 py-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-text-3)" }}
            >
              Visitante anónimo
            </p>
            <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
              {shortId(visitorId)}
            </p>
            <p className="font-mono text-[10px]" style={{ color: "var(--color-text-3)" }}>
              {visitorId}
            </p>
          </div>

          <div className="h-8 w-px hidden sm:block" style={{ background: "var(--color-border)" }} />

          {[
            { label: "Sesiones", value: visitorSessions.length },
            { label: "WA clicks", value: waClicks },
            { label: "Servicios", value: servicesViewed },
            { label: "Grabaciones", value: recordingsCount },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px]" style={{ color: "var(--color-text-3)" }}>{label}</p>
              <p className="text-lg font-bold tracking-tight" style={{ color: "var(--color-text-1)" }}>
                {value}
              </p>
            </div>
          ))}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <IntentBadge level={maxIntent} />
            <SourceBadge source={summary.firstSource} />
          </div>
        </div>

        {/* Fila 2: Tabs */}
        <div className="flex gap-0 overflow-x-auto px-3">
          {tabs.map(([key, label]) => {
            const active = activeTab === key;
            return (
              <Link
                key={key}
                href={tabHref(key)}
                className="flex shrink-0 items-center border-b-2 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors"
                style={
                  active
                    ? { borderColor: "var(--color-primary)", color: "var(--color-primary)" }
                    : { borderColor: "transparent", color: "var(--color-text-2)" }
                }
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Contenido del tab */}
      <section className="bf-defer">
        {activeTab === "resumen" && (
          <SummaryTab sessions={visitorSessions} activeSession={activeSession} visitorId={visitorId} />
        )}
        {activeTab === "grabaciones" && (
          <RecordingsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        )}
        {activeTab === "journey" && (
          <JourneyTab sessions={visitorSessions} visitorId={visitorId} />
        )}
        {activeTab === "sesiones" && (
          <SessionsTab sessions={visitorSessions} visitorId={visitorId} activeSessionId={activeSession.session_id} />
        )}
        {activeTab === "eventos" && (
          <EventsTab sessions={visitorSessions} activeSessionId={activeSession.session_id} />
        )}
        {activeTab === "atribucion" && <AttributionTab session={activeSession} />}
        {activeTab === "tecnico" && <TechnicalTab session={activeSession} />}
      </section>
    </AppShell>
  );
}

function SummaryTab({ sessions, activeSession, visitorId }: { sessions: Session[]; activeSession: Session; visitorId: string }) {
  const importantEvents = sessions
    .flatMap((s) => s.events.filter((e) => e.event_name !== "page_view_custom"))
    .slice(-4);
  const hasRecording = activeSession.recording?.status === "available";

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div
        className="overflow-hidden rounded-xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Qué sabemos
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--color-text-2)" }}>
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

      <div
        className="overflow-hidden rounded-xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Sesión seleccionada
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KeyValue label="Página" value={activeSession.page_path} />
          <KeyValue label="Campaña" value={activeSession.attribution.utm_campaign || "Sin campaña"} />
          <KeyValue label="Evento principal" value={mainEventLabel(activeSession)} />
          <KeyValue label="Duración" value={formatDuration(activeSession.duration)} />
        </div>
        {hasRecording && (
          <Link
            href={`/visitantes/${visitorId}?session=${activeSession.session_id}&tab=grabaciones`}
            className="mt-4 inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            Ver grabación
          </Link>
        )}
      </div>

      <div
        className="overflow-hidden rounded-xl border p-5 xl:col-span-2"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Últimos eventos de intención
        </h2>
        <div className="mt-4 space-y-2">
          {importantEvents.length ? (
            importantEvents.map((event) => (
              <div
                key={event.event_id}
                className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[180px_1fr_1fr]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span style={{ color: "var(--color-text-3)" }}>{formatDateTime(event.timestamp)}</span>
                <span className="font-medium" style={{ color: "var(--color-text-1)" }}>
                  {eventLabels[event.event_name]}
                </span>
                <span style={{ color: "var(--color-text-2)" }}>
                  {event.cta_text || event.page_path}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
              Solo página vista registrada en esta sesión.
            </p>
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
          <div
            className="rounded-xl border p-5 text-sm"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-2)" }}
          >
            Este visitante no tiene grabaciones disponibles.
          </div>
        )}
      </div>
      <div
        className="overflow-hidden rounded-xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Grabaciones del visitante
        </h2>
        <div className="mt-4 space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.session_id}
              href={`/visitantes/${visitorId}?session=${session.session_id}&tab=grabaciones`}
              className="block rounded-lg border p-3 transition-colors"
              style={
                session.session_id === activeSessionId
                  ? { borderColor: "var(--color-primary)", background: "var(--color-primary-bg)" }
                  : { borderColor: "var(--color-border)", background: "transparent" }
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: "var(--color-text-1)" }} title={session.session_id}>
                  Sesión {shortId(session.session_id)}
                </p>
                <StatusBadge
                  label={session.recording?.status === "available" ? "Grabación" : "Sin grabación"}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-3)" }}>
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
  whatsapp_click: "var(--color-signal)",
  service_click: "var(--color-primary)",
  page_view_custom: "var(--color-border-2)",
};

function JourneyTab({ sessions, visitorId }: { sessions: Session[]; visitorId: string }) {
  return (
    <div className="space-y-4">
      {sessions.map((session, idx) => {
        const hasRecording = session.recording?.status === "available";
        return (
          <div
            key={session.session_id}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            {/* Session header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
                    Sesión{" "}
                    <span className="font-mono font-normal" style={{ color: "var(--color-text-2)" }}>
                      {shortId(session.session_id)}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
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
                    className="bf-chip transition-colors"
                    style={{
                      borderColor: "var(--color-primary)",
                      background: "var(--color-primary-bg)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Ver grabación
                  </Link>
                )}
              </div>
            </div>

            {session.attribution.utm_campaign && (
              <div
                className="border-b px-5 py-2 text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-3)" }}
              >
                Campaña:{" "}
                <span className="font-medium" style={{ color: "var(--color-text-2)" }}>
                  {session.attribution.utm_campaign}
                </span>
                {session.attribution.utm_medium && ` · ${session.attribution.utm_medium}`}
              </div>
            )}

            <div className="divide-y px-5" style={{ borderColor: "var(--color-border)" }}>
              {session.events.map((event) => (
                <div key={event.event_id} className="flex items-start gap-3 py-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: eventDot[event.event_name] ?? "var(--color-border-2)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-1)" }}>
                      {eventLabels[event.event_name]}
                    </span>
                    {event.cta_text && (
                      <span className="ml-2 text-sm" style={{ color: "var(--color-text-2)" }}>
                        &ldquo;{event.cta_text}&rdquo;
                      </span>
                    )}
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-3)" }}>
                      {session.page_path}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: "var(--color-text-3)" }}>
                    {formatDateTime(event.timestamp)}
                  </span>
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
    <div className="space-y-2">
      {sessions.map((session) => (
        <Link
          key={session.session_id}
          href={`/visitantes/${visitorId}?session=${session.session_id}&tab=sesiones`}
          className="block overflow-hidden rounded-xl border p-4 transition-colors"
          style={
            session.session_id === activeSessionId
              ? { borderColor: "var(--color-primary)", background: "var(--color-primary-bg)" }
              : { borderColor: "var(--color-border)", background: "var(--color-surface)" }
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold" style={{ color: "var(--color-text-1)" }} title={session.session_id}>
              {shortId(session.session_id)}
            </p>
            <SourceBadge source={session.source} />
            <StatusBadge label={mainEventLabel(session)} />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-2)" }}>
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
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div
        className="border-b px-5 py-3 text-sm font-medium"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-1)",
        }}
        title={activeSessionId}
      >
        Sesión activa: {shortId(activeSessionId)}
      </div>
      {activeEvents.map((event) => (
        <div
          key={event.event_id}
          className="grid gap-3 border-b px-5 py-3 text-sm md:grid-cols-[180px_1fr_1fr_1fr]"
          style={{ borderColor: "var(--color-border)" }}
        >
          <span style={{ color: "var(--color-text-3)" }}>{formatDateTime(event.timestamp)}</span>
          <span className="font-medium" style={{ color: "var(--color-text-1)" }}>
            {eventLabels[event.event_name]}
          </span>
          <span style={{ color: "var(--color-text-2)" }}>{event.page_path}</span>
          <span style={{ color: "var(--color-text-2)" }}>{event.cta_text || "Sin dato"}</span>
        </div>
      ))}
    </div>
  );
}

function AttributionTab({ session }: { session: Session }) {
  const fields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "referrer"];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <KeyValue label="Fuente" value={session.source} />
      <KeyValue label="Referencia" value={readableReferrer(session.attribution.referrer)} />
      {fields.map((field) => (
        <KeyValue
          key={field}
          label={humanField(field)}
          value={session.attribution[field as keyof typeof session.attribution] || "Sin dato"}
        />
      ))}
    </div>
  );
}

function TechnicalTab({ session }: { session: Session }) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
          Datos técnicos
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-2)" }}>
          Nombres técnicos y payloads completos.
        </p>
      </div>
      <pre
        className="overflow-auto rounded-xl border p-5 text-xs leading-5"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-text-1)",
          color: "oklch(92% 0.01 255)",
        }}
      >
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--color-text-3)" }}>
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold" style={{ color: "var(--color-text-1)" }}>
        {value}
      </p>
    </div>
  );
}
