import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { getDashboardMetrics, getPostHogAdapterNotes } from "@/lib/analytics";
import { campaignSummaries, servicePageSummaries, sessions, trackingHealth } from "@/lib/mock-data";
import { humanValue } from "@/lib/labels";

export default function Home() {
  const metrics = getDashboardMetrics();

  return (
    <AppShell
      title="Dashboard inicial"
      description="Command center V0 para entender sesiones, eventos, atribucion y grabaciones sin inventar datos comerciales que todavia no existen."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sesiones capturadas" value={metrics.sessions} detail={`${metrics.visitors} visitantes anonimos en el mock V0.`} />
        <MetricCard label="WhatsApp clicks" value={metrics.whatsappClicks} detail="Evento principal de conversion visible hoy." />
        <MetricCard label="Service clicks" value={metrics.serviceClicks} detail="Senal previa de interes por servicio." />
        <MetricCard label="Replay disponible" value={`${metrics.replayRate}%`} detail={`${metrics.recordings} sesiones con grabacion PostHog.`} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Flujo observable V0</h2>
              <p className="mt-1 text-sm text-slate-500">Solo se muestran etapas respaldadas por tracking actual.</p>
            </div>
            <Link href="/eventos" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Ver eventos
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Anuncio / fuente", "Pagina de servicio", "Sesion", "Click WhatsApp"].map((step, index) => (
              <div key={step} className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-xs font-semibold text-cyan-700">Paso {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Lectura rapida</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Campana con mas senal</p>
              <p className="mt-1 font-medium text-slate-950">{metrics.topCampaign.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Servicio mas activo</p>
              <p className="mt-1 font-medium text-slate-950">{humanValue(metrics.topService.service)}</p>
            </div>
            <div>
              <p className="text-slate-500">Riesgo principal</p>
              <p className="mt-1 text-amber-700">No convertir tracking V0 en CRM antes de conectar resultados comerciales reales.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <RecentSessions sessions={sessions.slice(0, 5)} />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Tracking Health</h2>
          <div className="mt-4 space-y-3">
            {trackingHealth.slice(0, 3).map((item) => (
              <Link key={item.id} href="/tracking" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-950">{item.title}</p>
                  <StatusBadge label={item.severity} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Top campanas / fuentes</h2>
          <div className="mt-4 space-y-3">
            {campaignSummaries.slice(0, 4).map((campaign) => (
              <div key={`${campaign.source}-${campaign.name}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-medium text-slate-950">{campaign.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{campaign.medium} · {campaign.campaign_id || "sin ID de campana"}</p>
                </div>
                <SourceBadge source={campaign.source} />
                <p className="text-sm font-medium text-slate-700">{campaign.whatsapp_clicks} WhatsApp</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Paginas / servicios</h2>
          <div className="mt-4 space-y-3">
            {servicePageSummaries.slice(0, 4).map((page) => (
              <div key={page.path} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{humanValue(page.service)}</p>
                  <p className="text-sm text-slate-500">{page.sessions} sesiones</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">{page.path}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">API readiness</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {getPostHogAdapterNotes().map((note) => (
            <p key={note} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{note}</p>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
