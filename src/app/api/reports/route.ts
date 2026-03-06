import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { partnerFilter } from "@/lib/db/helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pf = partnerFilter(session);

    // Pipeline: deals by status
    const pipeline = await db
      .select({
        status: deals.status,
        count: sql<number>`count(*)::int`,
        volume: sql<string>`coalesce(sum(annual_volume), 0)`,
      })
      .from(deals)
      .where(pf)
      .groupBy(deals.status);

    // Revenue by tier
    const revenueByTier = await db
      .select({
        tier: sql<string>`pricing_result->>'tierName'`,
        count: sql<number>`count(*)::int`,
        volume: sql<string>`coalesce(sum(annual_volume), 0)`,
        savings: sql<string>`coalesce(sum((pricing_result->>'annualSavings')::numeric), 0)`,
        dccRevenue: sql<string>`coalesce(sum((pricing_result->'dccRevenue'->>'annualRevenue')::numeric), 0)`,
        avgMargin: sql<string>`coalesce(avg((pricing_result->'marginEstimate'->>'marginPercent')::numeric), 0)`,
      })
      .from(deals)
      .where(pf ? sql`${pf} AND pricing_result IS NOT NULL` : sql`pricing_result IS NOT NULL`)
      .groupBy(sql`pricing_result->>'tierName'`);

    // Monthly volume trends (last 12 months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
        volume: sql<string>`coalesce(sum(annual_volume), 0)`,
      })
      .from(deals)
      .where(
        pf
          ? sql`${pf} AND created_at >= now() - interval '12 months'`
          : sql`created_at >= now() - interval '12 months'`
      )
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    // Conversion funnel
    const statusOrder = ["draft", "review", "approved", "sent"];
    const funnel = statusOrder.map((s) => {
      const row = pipeline.find((p) => p.status === s);
      return { status: s, count: row?.count ?? 0 };
    });

    // Partner comparison (super_admin only)
    let partnerComparison = null;
    if (session.role === "super_admin") {
      partnerComparison = await db
        .select({
          partnerId: deals.partnerId,
          count: sql<number>`count(*)::int`,
          volume: sql<string>`coalesce(sum(annual_volume), 0)`,
          savings: sql<string>`coalesce(sum((pricing_result->>'annualSavings')::numeric), 0)`,
        })
        .from(deals)
        .where(sql`pricing_result IS NOT NULL`)
        .groupBy(deals.partnerId);
    }

    return NextResponse.json({
      pipeline,
      revenueByTier,
      monthlyTrends,
      funnel,
      partnerComparison,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
