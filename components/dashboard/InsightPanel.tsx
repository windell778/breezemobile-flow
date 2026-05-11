type InsightPanelProps = {
  now: string;
  opportunity: string;
  issue: string;
  nextModule: string;
};

export function InsightPanel({ now, opportunity, issue, nextModule }: InsightPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Lectura ejecutiva</h2>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-slate-500">Que esta pasando ahora</p>
          <p className="mt-1 text-slate-950">{now}</p>
        </div>
        <div>
          <p className="text-slate-500">Oportunidad principal</p>
          <p className="mt-1 text-emerald-700">{opportunity}</p>
        </div>
        <div>
          <p className="text-slate-500">Problema detectado</p>
          <p className="mt-1 text-amber-700">{issue}</p>
        </div>
        <div>
          <p className="text-slate-500">Siguiente modulo recomendado</p>
          <p className="mt-1 text-cyan-700">{nextModule}</p>
        </div>
      </div>
    </section>
  );
}
