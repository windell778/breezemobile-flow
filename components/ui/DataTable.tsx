import type { ReactNode } from "react";

type DataTableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function DataTable({ headers, children, className = "", headerClassName = "" }: DataTableProps) {
  return (
    <div className={`bf-apple-table ${className}`.trim()}>
      <div
        className={`bf-apple-table-header hidden grid-cols-[var(--cols)] md:grid ${headerClassName}`.trim()}
      >
        {headers.map((header) => (
          <div key={header} className="px-4 py-3">
            {header}
          </div>
        ))}
      </div>
      <div className="bf-premium-table-body">{children}</div>
    </div>
  );
}
