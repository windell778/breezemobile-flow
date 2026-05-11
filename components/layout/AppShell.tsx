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
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-0">
        <div className="hidden border-r border-slate-200 bg-white lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 px-4 py-4 md:px-6">
          <Topbar />
          <main className="pb-12">
            <header className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Tracking V0</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{title}</h1>
              {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p> : null}
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
