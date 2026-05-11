import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function AppShell({ children, title = "BreezeMobile Flow Intelligence", description }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-slate-950">
      <div className="flex min-h-screen w-full">
        <div className="hidden shrink-0 border-r border-slate-200 bg-white lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 px-4 py-4 md:px-6 lg:px-8">
          <Topbar />
          <main className="mx-auto w-full max-w-[1500px] pb-12">
            <header className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tracking V0</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-[26px]">{title}</h1>
                {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p> : null}
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                Mock compatible con PostHog API
              </div>
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
