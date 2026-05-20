import Link from "next/link";
import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

type FilterChipProps = {
  href: string;
  children: ReactNode;
  active?: boolean;
  tone?: "default" | "active" | "warning";
};

export function FilterBar({ children, className = "" }: FilterBarProps) {
  return (
    <section className={`bf-panel p-3 ${className}`.trim()}>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function FilterChip({ href, children, active = false, tone = "default" }: FilterChipProps) {
  const toneClass =
    active || tone === "active"
      ? "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950";

  return (
    <Link href={href} className={`bf-chip ${toneClass}`}>
      {children}
    </Link>
  );
}
