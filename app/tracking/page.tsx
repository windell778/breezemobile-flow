import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { eventTypes, serviceKeys, trackingFields, trackingHealth } from "@/lib/mock-data";
import { eventLabels, humanField, humanValue } from "@/lib/labels";
import type { ReactNode } from "react";

export default function TrackingPage() {
  return (
    <AppShell
      title="Tracking Health"
      description="Contrato tecnico de la V0: eventos, servicios, campos disponibles y limites explicitos de lo que la interfaz puede afirmar."
    >
      <section className="grid gap-3 md:grid-cols-2">
        {trackingHealth.map((item) => (
          <article key={item.id} className="bf-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.area}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
              </div>
              <StatusBadge label={item.severity} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{item.recommendation}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-3">
        <Panel title="Eventos dataLayer / PostHog">
          {eventTypes.map((eventName) => <CodePill key={eventName} label={`${eventLabels[eventName]} (${eventName})`} />)}
        </Panel>
        <Panel title="Servicios detectados">
          {serviceKeys.map((service) => <CodePill key={service} label={`${humanValue(service)} (${service})`} />)}
        </Panel>
        <Panel title="Fuentes futuras">
          {["PostHog API", "GTM/dataLayer validacion", "Meta Ads posterior", "n8n + CAPI posterior"].map((item) => <CodePill key={item} label={item} />)}
        </Panel>
      </section>

      <section className="bf-panel mt-4 p-4">
        <h2 className="text-lg font-semibold text-slate-950">Campos disponibles</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {trackingFields.map((field) => (
            <span key={field} className="bf-chip bg-slate-50 text-slate-600">
              {humanField(field)} <span className="font-mono text-slate-400">({field})</span>
            </span>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bf-panel p-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CodePill({ label }: { label: string }) {
  return <span className="bf-chip bg-slate-50 text-slate-600">{label}</span>;
}
