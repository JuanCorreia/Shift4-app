"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { openMobileMenu } from "./SidebarClient";
import { ROLES } from "@/lib/constants";

interface TopBarProps {
  userName: string;
  userRole: string;
}

export default function TopBar({ userName, userRole }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const roleLabel = ROLES[userRole as keyof typeof ROLES] ?? userRole;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left: mobile menu + title area */}
      <div className="flex items-center gap-3">
        <button
          onClick={openMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-700">{userName}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
