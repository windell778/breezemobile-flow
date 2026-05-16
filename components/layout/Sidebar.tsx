import { NavLinks } from "@/components/layout/NavLinks";

export function Sidebar() {
  const isPostHog = process.env.DATA_SOURCE === "posthog";

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col bg-white">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 font-mono text-sm font-semibold text-white">
          BM
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">BreezeMobile</p>
          <p className="truncate text-xs text-slate-400">Flow Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </div>

      {/* Data source badge */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">Fuente V0</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isPostHog
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {isPostHog ? "PostHog" : "Mock"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            {isPostHog ? "Datos reales vía PostHog API." : "Mock compatible con PostHog API."}{" "}
            GTM/dataLayer valida el contrato.
          </p>
        </div>
      </div>
    </aside>
  );
}
