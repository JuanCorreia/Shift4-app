import { redirect } from "next/navigation";
import { getSession, clearSession, createSession } from "@/lib/auth/session";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Force re-login for stale sessions missing partnerId (pre-migration tokens)
  if (!session.partnerId && session.role !== "super_admin") {
    await clearSession();
    redirect("/login");
  }

  // Session refresh: if token expires within 2 days, re-issue
  const tokenPayload = session as unknown as Record<string, unknown>;
  if (tokenPayload.exp && typeof tokenPayload.exp === "number") {
    const twoDaysFromNow = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60;
    if (tokenPayload.exp < twoDaysFromNow) {
      await createSession({
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        partnerId: session.partnerId,
        partnerName: session.partnerName,
      });
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="lg:pl-64 pb-20 lg:pb-0">
          <TopBar userName={session.name} userRole={session.role} partnerName={session.partnerName} />

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        <MobileNav />
      </div>
    </ToastProvider>
  );
}
