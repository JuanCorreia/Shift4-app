import { redirect } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth/session";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
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

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="lg:pl-64">
          <TopBar userName={session.name} userRole={session.role} partnerName={session.partnerName} />

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
