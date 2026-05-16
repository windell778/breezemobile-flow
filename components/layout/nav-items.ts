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
    items: [
      { label: "Resumen", href: "/", icon: "◎" },
    ],
  },
  {
    group: "Comportamiento",
    items: [
      { label: "Sesiones", href: "/sesiones", icon: "S" },
      { label: "Grabaciones", href: "/grabaciones", icon: "R" },
    ],
  },
  {
    group: "Atribución",
    items: [
      { label: "Campañas", href: "/campanas", icon: "C" },
      { label: "Servicios", href: "/servicios", icon: "P" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { label: "Estado del tracking", href: "/tracking", icon: "T" },
      { label: "Eventos", href: "/eventos", icon: "E" },
    ],
  },
];

// Flat list for mobile compact mode
export const navItems = navGroups.flatMap((g) => g.items);
