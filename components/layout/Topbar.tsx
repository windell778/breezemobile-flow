export function Topbar() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111a30]/80 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <p className="text-sm font-semibold text-white">BreezeMobile</p>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden min-w-44 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400 md:block">
          Buscar sesión, visitante o campaña...
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200">Últimos 7 días</div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">Tracking activo</div>
      </div>
    </header>
  );
}
