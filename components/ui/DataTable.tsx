import type { ReactNode } from "react";

type DataTableProps = {
  headers: string[];
  children: ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="bf-panel overflow-hidden">
      <div className="hidden grid-cols-[var(--cols)] border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
        {headers.map((header) => (
          <div key={header} className="px-3 py-2">
            {header}
          </div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
