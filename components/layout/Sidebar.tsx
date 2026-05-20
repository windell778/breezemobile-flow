import { NavLinks } from "@/components/layout/NavLinks";

export function Sidebar() {
  return (
    <aside className="sticky top-0 z-30 flex h-screen w-24 items-center justify-center py-5">
      <div className="flex h-[calc(100dvh-40px)] min-h-[520px] w-16 flex-col items-center rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#111827_0%,#111827_62%,#151a33_100%)] px-2 py-4 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.92)]">
        <div className="group relative grid place-items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/8 font-mono text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            BM
          </div>
          <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 -translate-x-2 whitespace-nowrap rounded-xl bg-[var(--dark-button)] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-[0_18px_38px_-24px_rgba(30,41,59,0.75)] transition-[opacity,transform] duration-200 ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:opacity-100">
            BreezeMobile
            <span className="absolute left-0 top-1/2 size-2 -translate-x-1 -translate-y-1/2 rotate-45 bg-[var(--dark-button)]" />
          </div>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-visible">
          <NavLinks />
        </div>
      </div>
    </aside>
  );
}
