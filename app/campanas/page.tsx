import { AppShell } from "@/components/layout/AppShell";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { campaignSummaries } from "@/lib/mock-data";

export default function CampanasPage() {
  return (
    <AppShell
      title="Campanas y fuentes"
      description="Lectura de fuente, medio, campana y anuncio basada en los datos capturados por sesion."
    >
      <section className="grid gap-4">
        {campaignSummaries.map((campaign) => {
          const conversionRate = campaign.sessions ? Math.round((campaign.whatsapp_clicks / campaign.sessions) * 100) : 0;
          return (
            <article key={`${campaign.source}-${campaign.name}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{campaign.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{campaign.medium} · {campaign.campaign_id || "sin campaign_id"}</p>
                </div>
                <SourceBadge source={campaign.source} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <Metric label="Sesiones" value={campaign.sessions} />
                <Metric label="Page views" value={campaign.page_views} />
                <Metric label="Service clicks" value={campaign.service_clicks} />
                <Metric label="WhatsApp clicks" value={campaign.whatsapp_clicks} />
                <Metric label="Tasa WA" value={`${conversionRate}%`} />
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
