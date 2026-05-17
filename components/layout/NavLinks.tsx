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
      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium"
              style={
                active
                  ? { borderColor: "var(--color-primary)", background: "var(--color-primary-bg)", color: "var(--color-primary)" }
                  : { borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-2)" }
              }
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
          <p
            className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-3)" }}
          >
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
                  className="flex h-8 items-center rounded-md px-2 text-[13px] font-medium transition-colors"
                  style={
                    active
                      ? { background: "var(--color-primary-bg)", color: "var(--color-primary)" }
                      : { color: "var(--color-text-2)" }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
