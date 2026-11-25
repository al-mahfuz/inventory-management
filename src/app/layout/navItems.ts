import { ArrowLeftRight, Boxes, History, LayoutDashboard, Package, Tags, Truck, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/products", labelKey: "nav.products", icon: Package },
  { href: "/stock", labelKey: "nav.stock", icon: ArrowLeftRight },
  { href: "/movements", labelKey: "nav.movements", icon: History },
  { href: "/categories", labelKey: "nav.categories", icon: Tags },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { href: "/warehouses", labelKey: "nav.warehouses", icon: Boxes },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound }
] as const;
