import { NavLinks } from "@/components/layout/NavLinks";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-slate-200 bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 lg:hidden">BM</div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <p className="text-sm font-semibold text-slate-950">BreezeMobile</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <form action="/sesiones" className="hidden min-w-44 flex-1 md:block">
            <input
              name="q"
              placeholder="Buscar en sesiones..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </form>
          <div className="hidden h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 sm:flex">Ultimos 7 dias</div>
          <div className="flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tracking activo
          </div>
        </div>
      </div>
      <div className="mt-3 lg:hidden">
        <NavLinks compact />
      </div>
    </header>
  );
}
