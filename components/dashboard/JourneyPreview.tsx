type JourneyPreviewProps = {
  steps: readonly string[];
};

export function JourneyPreview({ steps }: JourneyPreviewProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f162a]/85 p-5">
      <h2 className="text-lg font-semibold text-white">Mapa del Journey Comercial</h2>
      <p className="mt-1 text-sm text-slate-400">Visualización rápida del flujo desde adquisición hasta cierre.</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{step}</span>
            {index < steps.length - 1 ? <span className="text-slate-500">→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
