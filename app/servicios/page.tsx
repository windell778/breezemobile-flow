import { AppShell } from "@/components/layout/AppShell";
import { servicePageSummaries } from "@/lib/mock-data";
import { humanValue } from "@/lib/labels";

export default function ServiciosPage() {
  return (
    <AppShell
      title="Paginas y servicios"
      description="Vista por pagina/servicio para entender volumen, interes y contacto real antes de conectar datos comerciales."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servicePageSummaries.map((page) => {
          const clicks = page.service_clicks + page.whatsapp_clicks;
          return (
            <article key={page.path} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="relative h-36 rounded-t-lg border-b border-slate-200 bg-slate-50">
                <div className="absolute left-4 top-4 h-3 w-24 rounded bg-slate-300" />
                <div className="absolute left-4 top-10 h-4 w-44 rounded bg-slate-400" />
                <div className="absolute left-4 top-[68px] h-3 w-32 rounded bg-slate-200" />
                <div className="absolute bottom-4 left-4 h-8 w-24 rounded bg-cyan-600" />
                <div className="absolute right-4 top-4 rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">{clicks} clicks</div>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-slate-950">{humanValue(page.service)}</h2>
                <p className="mt-1 font-mono text-sm text-slate-500">{page.path}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Sesiones" value={page.sessions} />
                  <Metric label="Page views" value={page.page_views} />
                  <Metric label="Service clicks" value={page.service_clicks} />
                  <Metric label="WhatsApp clicks" value={page.whatsapp_clicks} />
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
