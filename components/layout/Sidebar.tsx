import { NavLinks } from "@/components/layout/NavLinks";

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 font-mono text-sm font-semibold text-white">BM</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">BreezeMobile</p>
          <p className="truncate text-xs text-slate-500">Flow Intelligence</p>
        </div>
      </div>
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Proyecto</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Comportamiento, atribucion y replay sobre tracking propio.</p>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Navegacion</p>
        <NavLinks />
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-800">Fuente V0</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Activo</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Mock compatible con PostHog API. GTM/dataLayer valida el contrato.</p>
        </div>
      </div>
    </aside>
  );
}
