import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function AppShell({ children, title, description, actions }: AppShellProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pb-16 pt-6 md:px-8 lg:px-10">
          {title && (
            <header className="mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    Flow Intelligence
                  </p>
                  <h1
                    className="mt-1 text-2xl font-bold tracking-tight"
                    style={{ color: "var(--color-text-1)" }}
                  >
                    {title}
                  </h1>
                  {description && (
                    <p
                      className="mt-1.5 max-w-2xl text-sm leading-relaxed"
                      style={{ color: "var(--color-text-2)" }}
                    >
                      {description}
                    </p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
