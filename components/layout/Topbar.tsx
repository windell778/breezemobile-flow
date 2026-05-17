import { NavLinks } from "@/components/layout/NavLinks";

export function Topbar() {
  const isPostHog = process.env.DATA_SOURCE === "posthog";

  return (
    <header
      className="sticky top-0 z-20 -mx-5 mb-0 border-b px-5 py-2.5 md:-mx-8 md:px-8 lg:hidden"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "var(--color-primary)" }}
          >
            <span className="text-[10px] font-bold text-white">BM</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-1)" }}>
              BreezeMobile
            </p>
          </div>
        </div>
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
      <div className="mt-2">
        <NavLinks compact />
      </div>
    </header>
  );
}
