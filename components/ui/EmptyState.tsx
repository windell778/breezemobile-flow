import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({
  title = "Sin datos para mostrar",
  message = "No hay datos disponibles.",
  action,
}: EmptyStateProps) {
  return (
    <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
