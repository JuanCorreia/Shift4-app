"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Menu, LogOut, Globe } from "lucide-react";
import { openMobileMenu } from "./SidebarClient";
import { ROLES } from "@/lib/constants";
import NotificationBell from "./NotificationBell";
import { LOCALES } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/messages";

interface TopBarProps {
  userName: string;
  userRole: string;
  partnerName?: string;
}

export default function TopBar({ userName, userRole, partnerName }: TopBarProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof document !== "undefined") {
      const cookie = document.cookie.split("; ").find((c) => c.startsWith("locale="));
      return (cookie?.split("=")[1] as Locale) || "en";
    }
    return "en";
  });

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

      {/* Right: language + notifications + partner badge + user info + logout */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <Globe className="h-4 w-4 text-slate-400 absolute left-2 pointer-events-none" />
          <select
            value={locale}
            onChange={(e) => {
              const newLocale = e.target.value as Locale;
              setLocale(newLocale);
              document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
              router.refresh();
            }}
            className="pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag}
              </option>
            ))}
          </select>
        </div>
        <NotificationBell />
        {partnerName && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            {partnerName}
          </span>
        )}
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
