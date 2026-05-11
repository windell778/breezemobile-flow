import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { JourneyPreview } from "@/components/dashboard/JourneyPreview";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { journeySteps, leads, sessions } from "@/lib/mock-data";

export default function Home() {
  const sessionCount = sessions.length;
  const whatsappClicks = sessions.filter((session) => session.whatsappClick).length;
  const highIntentSessions = sessions.filter((session) => session.intentLevel === "Alta").length;
  const highIntentRate = Math.round((highIntentSessions / sessionCount) * 100);

  return (
    <AppShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">BreezeMobile Flow Intelligence</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Command center para visualizar campañas, sesiones, leads y recorrido comercial.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Sesiones capturadas" value={String(sessionCount)} description="Tráfico detectado en el período activo." trend="+12% vs semana anterior" />
          <KpiCard title="WhatsApp clicks" value={String(whatsappClicks)} description="Usuarios que iniciaron contacto directo." trend="Canal más fuerte: Meta Ads" />
          <KpiCard title="Leads detectados" value={String(leads.length)} description="Leads con intención comercial identificada." trend="2 leads listos para cotización" />
          <KpiCard title="Tasa de intención alta" value={`${highIntentRate}%`} description="Porcentaje de sesiones con señal fuerte de compra." trend="Mejora en servicios de urgencia" />
        </section>

        <JourneyPreview steps={journeySteps} />

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <RecentSessions sessions={sessions} />
          <InsightPanel
            now="Las sesiones de Frenos y Aire acondicionado concentran los clics en WhatsApp durante la mañana."
            opportunity="Escalar presupuesto en AC GAM Mayo y duplicar creativos con llamada urgente."
            issue="Sesiones Direct sin replay dificultan entender fricción en la página de cambio de aceite."
            nextModule="Módulo de Replay + Embudo por servicio para priorizar optimizaciones."
          />
        </div>
      </section>
    </AppShell>
  );
}
