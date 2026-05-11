type InsightPanelProps = {
  now: string;
  opportunity: string;
  issue: string;
  nextModule: string;
};

export function InsightPanel({ now, opportunity, issue, nextModule }: InsightPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#12162a]/90 p-5">
      <h2 className="text-lg font-semibold text-white">Lectura ejecutiva</h2>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-slate-400">Qué está pasando ahora</p>
          <p className="mt-1 text-slate-100">{now}</p>
        </div>
        <div>
          <p className="text-slate-400">Oportunidad principal</p>
          <p className="mt-1 text-emerald-200">{opportunity}</p>
        </div>
        <div>
          <p className="text-slate-400">Problema detectado</p>
          <p className="mt-1 text-amber-200">{issue}</p>
        </div>
        <div>
          <p className="text-slate-400">Siguiente módulo recomendado</p>
          <p className="mt-1 text-cyan-200">{nextModule}</p>
        </div>
      </div>
    </section>
  );
}
