"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, navGroups } from "@/components/layout/nav-items";

type NavLinksProps = {
  compact?: boolean;
};

export function NavLinks({ compact = false }: NavLinksProps) {
  const pathname = usePathname();

  if (compact) {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium ${
                active
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {group.group}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] ${
                      active
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
