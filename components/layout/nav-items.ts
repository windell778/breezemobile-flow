export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    group: "Operación",
    items: [{ label: "Resumen", href: "/", icon: "dashboard" }],
  },
  {
    group: "Comportamiento",
    items: [{ label: "Sesiones", href: "/sesiones", icon: "sessions" }],
  },
  {
    group: "Atribución",
    items: [
      { label: "Campañas", href: "/campanas", icon: "campaigns" },
      { label: "Servicios", href: "/servicios", icon: "services" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { label: "Estado del tracking", href: "/tracking", icon: "tracking" },
      { label: "Eventos", href: "/eventos", icon: "events" },
    ],
  },
];

export const navItems = navGroups.flatMap((group) => group.items);
