import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, like, and, gte, lte, desc, SQL } from "drizzle-orm";
import { partnerFilter } from "@/lib/db/helpers";
import { rateLimit } from "@/lib/rate-limit";

function getTierLabel(volume: string): string {
  const v = Number(volume);
  if (v >= 100_000_000) return "Tier 1";
  if (v >= 25_000_000) return "Tier 2";
  if (v >= 5_000_000) return "Tier 3";
  if (v >= 1_000_000) return "Tier 4";
  return "Tier 5";
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success: rateLimitOk } = rateLimit(`export-csv:${session.userId}`, 5, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many export requests. Try again in a minute." },
        { status: 429 }
      );
    }

    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") || "all";
    const search = sp.get("search") || "";
    const from = sp.get("from") || "";
    const to = sp.get("to") || "";

    const conditions: SQL[] = [];
    const pf = partnerFilter(session);
    if (pf) conditions.push(pf);

    if (status && status !== "all") {
      conditions.push(eq(deals.status, status as "draft" | "review" | "approved" | "sent" | "archived"));
    }
    if (search) {
      conditions.push(like(deals.merchantName, `%${search}%`));
    }
    if (from) {
      conditions.push(gte(deals.createdAt, new Date(from)));
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      conditions.push(lte(deals.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(deals)
      .where(whereClause)
      .orderBy(desc(deals.createdAt))
      .limit(5000);

    const header = "Merchant,Hotel Group,Status,Annual Volume,Tier,Rate (bps),Savings,Date";
    const csvRows = rows.map((d) => {
      const pr = d.pricingResult as Record<string, unknown> | null;
      return [
        escapeCsv(d.merchantName),
        escapeCsv(d.hotelGroup || ""),
        d.status,
        d.annualVolume,
        getTierLabel(d.annualVolume),
        pr ? String(Number(pr.adjustedRate ?? 0).toFixed(0)) : "",
        pr ? String(Number(pr.annualSavings ?? 0).toFixed(0)) : "",
        d.createdAt.toISOString().split("T")[0],
      ].join(",");
    });

    const csv = [header, ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="deals-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
