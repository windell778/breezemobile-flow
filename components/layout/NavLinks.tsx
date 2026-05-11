"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

type NavLinksProps = {
  compact?: boolean;
};

export function NavLinks({ compact = false }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={
              compact
                ? `shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium ${
                    active ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`
                : `flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium ${
                    active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`
            }
          >
            {!compact ? (
              <span className={`grid h-5 w-5 place-items-center rounded-md border font-mono text-[10px] ${
                active ? "border-slate-300 bg-white text-slate-950" : "border-slate-200 bg-slate-50 text-slate-400"
              }`}>
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
