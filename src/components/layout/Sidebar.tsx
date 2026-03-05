import { getSession } from "@/lib/auth/session";
import { NAV_ITEMS } from "@/lib/constants";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const session = await getSession();
  const role = session?.role ?? "viewer";

  const navItems = NAV_ITEMS.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
  }));

  return <SidebarClient navItems={navItems} role={role} />;
}
