export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { getPostHogAdapterNotes } from "@/lib/analytics";
import { getAdapter, DEFAULT_WORKSPACE_ID } from "@/lib/data/adapter";
import { humanValue } from "@/lib/labels";

export default async function Home() {
  const adapter = getAdapter();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [metrics, trackingHealth, recentSessions] = await Promise.all([
    adapter.getDashboardMetrics(workspaceId),
    adapter.getTrackingHealth(workspaceId),
    adapter.listSessions(workspaceId, { limit: 5 }),
  ]);

  return (
    <AppShell
      title="Dashboard inicial"
      description="Command center V0 para entender sesiones, eventos, atribucion y grabaciones sin inventar datos comerciales que todavia no existen."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/sesiones" className="block transition hover:-translate-y-0.5">
          <MetricCard label="Sesiones capturadas" value={metrics.sessions} detail={`${metrics.visitors} visitantes anonimos registrados.`} />
        </Link>
        <Link href="/eventos?event=whatsapp_click" className="block transition hover:-translate-y-0.5">
          <MetricCard label="WhatsApp clicks" value={metrics.whatsappClicks} detail="Evento principal de conversion visible hoy." />
        </Link>
        <Link href="/eventos?event=service_click" className="block transition hover:-translate-y-0.5">
          <MetricCard label="Service clicks" value={metrics.serviceClicks} detail="Senal previa de interes por servicio." />
        </Link>
        <Link href="/grabaciones" className="block transition hover:-translate-y-0.5">
          <MetricCard label="Replay disponible" value={`${metrics.replayRate}%`} detail={`${metrics.recordings} sesiones con grabacion PostHog.`} />
        </Link>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="bf-panel p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Flujo observable V0</h2>
              <p className="mt-1 text-sm text-slate-500">Solo se muestran etapas respaldadas por tracking actual.</p>
            </div>
            <Link href="/eventos" className="bf-control text-slate-700 hover:bg-slate-50">
              Ver eventos
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["Anuncio / fuente", "/campanas"],
              ["Pagina de servicio", "/servicios"],
              ["Sesion", "/sesiones"],
              ["Click WhatsApp", "/eventos?event=whatsapp_click"],
            ].map(([step, href], index) => (
              <Link key={step} href={href} className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white">
                <p className="text-xs font-semibold text-slate-500">Paso {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{step}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bf-panel p-4">
          <h2 className="text-lg font-semibold text-slate-950">Lectura rapida</h2>
          <div className="mt-4 space-y-4 text-sm">
            {metrics.topCampaign ? (
              <Link href={`/sesiones?q=${encodeURIComponent(metrics.topCampaign.name)}`} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-slate-500">Campana con mas senal</p>
                <p className="mt-1 font-medium text-slate-950">{metrics.topCampaign.name}</p>
              </Link>
            ) : null}
            {metrics.topService ? (
              <Link href={`/sesiones?service=${metrics.topService.service}`} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                <p className="text-slate-500">Servicio mas activo</p>
                <p className="mt-1 font-medium text-slate-950">{humanValue(metrics.topService.service)}</p>
              </Link>
            ) : null}
            <div>
              <p className="text-slate-500">Riesgo principal</p>
              <p className="mt-1 text-amber-700">No convertir tracking V0 en CRM antes de conectar resultados comerciales reales.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <RecentSessions sessions={recentSessions} />

        <div className="bf-panel p-4">
          <h2 className="text-lg font-semibold text-slate-950">Tracking Health</h2>
          <div className="mt-4 space-y-3">
            {trackingHealth.slice(0, 3).map((item) => (
              <Link key={item.id} href="/tracking" className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
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
        <CampaignsSection workspaceId={workspaceId} />
        <ServicesSection workspaceId={workspaceId} />
      </section>

      <section className="bf-panel mt-6 p-4">
        <h2 className="text-lg font-semibold text-slate-950">API readiness</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {getPostHogAdapterNotes().map((note) => (
            <p key={note} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{note}</p>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

async function CampaignsSection({ workspaceId }: { workspaceId: string }) {
  const campaigns = await getAdapter().getCampaignSummaries(workspaceId);
  return (
    <div className="bf-panel p-4">
      <h2 className="text-lg font-semibold text-slate-950">Top campanas / fuentes</h2>
      <div className="mt-4 space-y-3">
        {campaigns.slice(0, 4).map((campaign) => (
          <Link key={`${campaign.source}-${campaign.name}`} href={`/sesiones?q=${encodeURIComponent(campaign.name)}`} className="grid gap-3 rounded-md border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="font-medium text-slate-950">{campaign.name}</p>
              <p className="mt-1 text-sm text-slate-500">{campaign.medium} - {campaign.campaign_id || "sin ID de campana"}</p>
            </div>
            <SourceBadge source={campaign.source} />
            <p className="text-sm font-medium text-slate-700">{campaign.whatsapp_clicks} WhatsApp</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function ServicesSection({ workspaceId }: { workspaceId: string }) {
  const services = await getAdapter().getServiceSummaries(workspaceId);
  return (
    <div className="bf-panel p-4">
      <h2 className="text-lg font-semibold text-slate-950">Paginas / servicios</h2>
      <div className="mt-4 space-y-3">
        {services.slice(0, 4).map((page) => (
          <Link key={page.path} href={`/sesiones?service=${page.service}`} className="block rounded-md border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-950">{humanValue(page.service)}</p>
              <p className="text-sm text-slate-500">{page.sessions} sesiones</p>
            </div>
            <p className="mt-1 text-sm text-slate-500">{page.path}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
