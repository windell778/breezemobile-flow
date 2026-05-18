import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  showPageHeader?: boolean;
};

export function AppShell({
  children,
  title = "BreezeMobile Flow Intelligence",
  description,
  showPageHeader = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-slate-950">
      <div className="flex min-h-screen w-full">
        {/* Sidebar — desktop only */}
        <div className="hidden shrink-0 border-r border-slate-200 lg:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 px-4 py-4 md:px-6 lg:px-8">
          <Topbar />
          <main className="mx-auto w-full max-w-[1500px] pb-12">
            {showPageHeader ? (
              <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Flow Intelligence
                  </p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 md:text-[26px]">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
                  ) : null}
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                  {process.env.DATA_SOURCE === "posthog" ? "PostHog" : "Mock"}
                </div>
              </header>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
