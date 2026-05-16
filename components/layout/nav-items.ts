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
    group: "Command Center",
    items: [
      { label: "Overview", href: "/", icon: "◎" },
    ],
  },
  {
    group: "Behavior",
    items: [
      { label: "Sesiones", href: "/sesiones", icon: "S" },
      { label: "Grabaciones", href: "/grabaciones", icon: "R" },
    ],
  },
  {
    group: "Attribution",
    items: [
      { label: "Campañas", href: "/campanas", icon: "C" },
      { label: "Servicios", href: "/servicios", icon: "P" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Tracking Health", href: "/tracking", icon: "T" },
      { label: "Eventos", href: "/eventos", icon: "E" },
    ],
  },
];

// Flat list for mobile compact mode
export const navItems = navGroups.flatMap((g) => g.items);
