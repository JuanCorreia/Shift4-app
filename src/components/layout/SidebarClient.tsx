"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, Settings, Building2, Zap, X } from "lucide-react";

const iconMap = {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Building2,
} as const;

interface NavItem {
  label: string;
  href: string;
  icon: keyof typeof iconMap | string;
}

interface SidebarClientProps {
  navItems: NavItem[];
  role: string;
}

export default function SidebarClient({ navItems, role }: SidebarClientProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = navItems.filter((item) => {
    if (item.href === "/settings" && role !== "admin" && role !== "super_admin") return false;
    if (item.href === "/partners" && role !== "super_admin") return false;
    return true;
  });

  const navContent = (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {filteredItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-800/20 text-[#CF987E]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#395542] border-r border-emerald-900/30">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-emerald-900/30">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-800">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Banyan
          </span>
        </div>
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#395542] border-r border-emerald-900/30 transform transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-900/30">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-800">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Banyan
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Mobile toggle button (hidden, triggered by TopBar) */}
      <button
        id="mobile-menu-toggle"
        className="hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      />
    </>
  );
}

export function openMobileMenu() {
  document.getElementById("mobile-menu-toggle")?.click();
}
