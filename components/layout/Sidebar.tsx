import { NavLinks } from "@/components/layout/NavLinks";

export function Sidebar() {
  const isPostHog = process.env.DATA_SOURCE === "posthog";

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r lg:flex"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Brand */}
      <div
        className="flex h-14 items-center gap-3 border-b px-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: "var(--color-primary)" }}
        >
          <span className="text-[10px] font-bold tracking-tight text-white">BM</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold" style={{ color: "var(--color-text-1)" }}>
            BreezeMobile
          </p>
          <p className="truncate text-[10px]" style={{ color: "var(--color-text-3)" }}>
            Flow Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <NavLinks />
      </nav>

      {/* Data source */}
      <div
        className="shrink-0 border-t px-3 py-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px]" style={{ color: "var(--color-text-3)" }}>
            Fuente de datos
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={
              isPostHog
                ? { background: "var(--color-signal-bg)", color: "var(--color-signal-text)" }
                : { background: "var(--color-surface-2)", color: "var(--color-text-2)" }
            }
          >
            {isPostHog ? "PostHog" : "Mock"}
          </span>
        </div>
      </div>
    </aside>
  );
}
