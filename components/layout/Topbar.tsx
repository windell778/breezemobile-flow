export function Topbar() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <p className="text-sm font-semibold text-slate-950">BreezeMobile</p>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden min-w-44 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 md:block">
          Buscar sesión, visitante o campaña...
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Ultimos 7 dias</div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Tracking activo</div>
      </div>
    </header>
  );
}
