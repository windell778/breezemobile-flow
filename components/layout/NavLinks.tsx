"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

type NavLinksProps = {
  compact?: boolean;
};

type IconProps = {
  name: string;
  active?: boolean;
};

type NavItem = (typeof navItems)[number];

const iconPaths: Record<string, string[]> = {
  dashboard: [
    "M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3Z",
    "M14 5.5A1.5 1.5 0 0 1 15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3Z",
    "M4 15.5A1.5 1.5 0 0 1 5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3Z",
    "M14 15.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3Z",
  ],
  sessions: [
    "M7 7h10",
    "M7 12h10",
    "M7 17h6",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
  ],
  recordings: [
    "M15 10l4.5-2.5v9L15 14",
    "M4.5 7h9A1.5 1.5 0 0 1 15 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7Z",
  ],
  campaigns: [
    "M4 14v-4",
    "M8 17V7",
    "M12 20V4",
    "M16 17V7",
    "M20 14v-4",
  ],
  services: [
    "M4 7h16",
    "M6 7v12h12V7",
    "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
    "M9 12h6",
  ],
  tracking: [
    "M12 21s7-4.5 7-10V5l-7-3-7 3v5.5c0 5.5 7 10.5 7 10.5Z",
    "m9.5 12 1.7 1.7 3.8-4.2",
  ],
  events: ["M13 2 5 14h7l-1 8 8-12h-7l1-8Z"],
};

function NavIcon({ name, active = false }: IconProps) {
  const paths = iconPaths[name] ?? iconPaths.dashboard;

  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-2xl transition-[background-color,color,transform,box-shadow] duration-200 ease-[var(--ease-out)] ${
        active
          ? "bg-[rgba(79,70,229,0.36)] text-white shadow-[0_16px_32px_-22px_rgba(79,70,229,0.95),inset_0_1px_0_rgba(255,255,255,0.14)]"
          : "text-white/52 group-hover:translate-x-0.5 group-hover:bg-white/10 group-hover:text-white group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] group-focus-visible:bg-white/10 group-focus-visible:text-white"
      }`}
    >
      <svg
        aria-hidden="true"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        {paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}

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
                  ? "border-blue-200 bg-blue-50 text-blue-700"
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

  const mainItems = navItems.slice(0, 4);
  const systemItems = navItems.slice(4);

  function renderDockItem(item: NavItem) {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    return (
      <Link
        key={item.label}
        href={item.href}
        aria-label={item.label}
        className={`group relative flex size-10 items-center justify-center rounded-2xl outline-none transition-transform duration-200 ease-[var(--ease-out)] focus-visible:ring-4 focus-visible:ring-white/15 ${
          active ? "text-white" : "text-white/60 active:scale-95"
        }`}
      >
        <NavIcon name={item.icon} active={active} />
        <span className="sr-only">{item.label}</span>
        {active ? (
          <span className="absolute -right-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--blue)] shadow-[0_0_0_3px_rgba(59,130,246,0.16)]" />
        ) : null}
        <span
          role="tooltip"
          className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-y-1/2 -translate-x-2 whitespace-nowrap rounded-xl bg-[var(--dark-button)] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-[0_18px_38px_-24px_rgba(30,41,59,0.75)] transition-[opacity,transform] duration-200 ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          {item.label}
          <span className="absolute left-0 top-1/2 size-2 -translate-x-1 -translate-y-1/2 rotate-45 bg-[var(--dark-button)]" />
        </span>
      </Link>
    );
  }

  return (
    <nav aria-label="Navegación principal" className="flex h-full flex-col items-center justify-between">
      <div className="space-y-3">{mainItems.map((item) => renderDockItem(item))}</div>
      <div className="space-y-3">{systemItems.map((item) => renderDockItem(item))}</div>
    </nav>
  );
}
