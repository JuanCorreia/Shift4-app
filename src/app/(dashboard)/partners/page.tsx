import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { partners, teamSettings, users, deals } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ShieldAlert, Building2 } from "lucide-react";
import PartnersClient from "./PartnersClient";

export default async function PartnersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
        <p className="mt-1 text-sm text-slate-500">
          Only super admins can manage partners.
        </p>
      </div>
    );
  }

  // Fetch all partners with stats
  const allPartners = await db.select().from(partners).orderBy(partners.createdAt);

  const partnerData = await Promise.all(
    allPartners.map(async (partner) => {
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.partnerId, partner.id));

      const [dealCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(deals)
        .where(eq(deals.partnerId, partner.id));

      const settings = await db
        .select()
        .from(teamSettings)
        .where(eq(teamSettings.partnerId, partner.id))
        .limit(1);

      return {
        ...partner,
        userCount: Number(userCount.count),
        dealCount: Number(dealCount.count),
        inviteCode: settings[0]?.inviteCode ?? null,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partners</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage partner organizations and their settings.
        </p>
      </div>

      <PartnersClient partners={partnerData} />
    </div>
  );
}
