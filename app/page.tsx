export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <section className="max-w-6xl mx-auto">
        <p className="text-sm text-cyan-400 font-medium">
          BreezeMobile Flow Intelligence
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Command center para campañas, sesiones y leads.
        </h1>

        <p className="mt-5 max-w-2xl text-slate-400 text-lg">
          Visualiza el recorrido completo desde Meta Ads hasta WhatsApp,
          cotización y venta.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-sm text-slate-400">Sesiones</p>
            <p className="mt-3 text-3xl font-semibold">1,248</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-sm text-slate-400">WhatsApp clicks</p>
            <p className="mt-3 text-3xl font-semibold">186</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-sm text-slate-400">Conversión</p>
            <p className="mt-3 text-3xl font-semibold">14.9%</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-sm text-slate-400">Servicio top</p>
            <p className="mt-3 text-3xl font-semibold">Frenos</p>
          </div>
        </div>
      </section>
    </main>
  );
}