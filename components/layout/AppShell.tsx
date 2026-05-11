import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = { children: ReactNode };

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_45%,_#02040b_100%)] p-4 text-slate-100 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl gap-4 md:gap-6">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1">
          <Topbar />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
