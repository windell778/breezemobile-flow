import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Sesiones", href: "#" },
  { label: "Campañas", href: "#" },
  { label: "Leads", href: "#" },
  { label: "Journey", href: "#" },
  { label: "Replay", href: "#" },
  { label: "Configuración", href: "#" },
];

export function Sidebar() {
  return (
    <aside className="w-full max-w-64 rounded-2xl border border-white/10 bg-[#0B1020]/80 p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Flow Intelligence</p>
      <p className="mt-2 text-lg font-semibold text-white">BreezeMobile</p>
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/5 hover:text-white"
          >
            <span>{item.label}</span>
            <span className="h-2 w-2 rounded-full bg-slate-600" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
