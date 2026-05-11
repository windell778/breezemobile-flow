type JourneyPreviewProps = {
  steps: readonly string[];
};

export function JourneyPreview({ steps }: JourneyPreviewProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Mapa del Journey Comercial</h2>
      <p className="mt-1 text-sm text-slate-500">Visualizacion rapida del flujo observable en V0.</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800">{step}</span>
            {index < steps.length - 1 ? <span className="text-slate-500">→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
