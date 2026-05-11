import type { ReactNode } from "react";

type DataTableProps = {
  headers: string[];
  children: ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[var(--cols)] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        {headers.map((header) => (
          <div key={header} className="px-4 py-3">
            {header}
          </div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
