import type { ElementType, ReactNode } from "react";

type PanelProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

type PanelHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  className?: string;
};

export function Panel({ as: Component = "section", children, className = "", padded = false }: PanelProps) {
  return (
    <Component className={`bf-panel ${padded ? "p-4" : ""} ${className}`.trim()}>
      {children}
    </Component>
  );
}

export function PanelHeader({ title, description, action, className = "" }: PanelHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 ${className}`.trim()}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatTile({ label, value, detail, className = "" }: StatTileProps) {
  return (
    <article className={`bf-panel p-4 ${className}`.trim()}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p> : null}
    </article>
  );
}
