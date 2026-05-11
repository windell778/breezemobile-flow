import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Sesiones", href: "/sesiones" },
  { label: "Grabaciones", href: "/grabaciones" },
  { label: "Eventos", href: "/eventos" },
  { label: "Campanas", href: "/campanas" },
  { label: "Servicios", href: "/servicios" },
  { label: "Tracking Health", href: "/tracking" },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Flow Intelligence</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">BreezeMobile</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Comportamiento, atribucion y replay sobre tracking propio.</p>
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-950"
          >
            <span>{item.label}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">Fuente V0</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Mock compatible con PostHog API. GTM/dataLayer valida el contrato.</p>
      </div>
    </aside>
  );
}
