import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, like, and, gte, lte, desc, SQL } from "drizzle-orm";
import { partnerFilter } from "@/lib/db/helpers";
import { rateLimit } from "@/lib/rate-limit";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createElement } from "react";

function getTierLabel(volume: string): string {
  const v = Number(volume);
  if (v >= 100_000_000) return "Tier 1";
  if (v >= 25_000_000) return "Tier 2";
  if (v >= 5_000_000) return "Tier 3";
  if (v >= 1_000_000) return "Tier 4";
  return "Tier 5";
}

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  table: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1e3a2f",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  headerCell: { color: "#fff", fontWeight: "bold", fontSize: 8 },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rowAlt: { backgroundColor: "#f8fafc" },
  cell: { fontSize: 8 },
  colMerchant: { width: "22%" },
  colHotel: { width: "16%" },
  colStatus: { width: "10%" },
  colVolume: { width: "14%" },
  colTier: { width: "8%" },
  colRate: { width: "8%" },
  colSavings: { width: "12%" },
  colDate: { width: "10%" },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 7, color: "#999", textAlign: "center" },
});

interface DealRow {
  merchantName: string;
  hotelGroup: string | null;
  status: string;
  annualVolume: string;
  tier: string;
  rate: string;
  savings: string;
  date: string;
}

function DealsReport({ rows, generatedAt }: { rows: DealRow[]; generatedAt: string }) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      createElement(Text, { style: styles.title }, "Deal List Export"),
      createElement(Text, { style: styles.subtitle }, `Generated ${generatedAt} — ${rows.length} deals`),
      createElement(
        View,
        { style: styles.table },
        // Header
        createElement(
          View,
          { style: styles.headerRow },
          createElement(Text, { style: [styles.headerCell, styles.colMerchant] }, "Merchant"),
          createElement(Text, { style: [styles.headerCell, styles.colHotel] }, "Hotel Group"),
          createElement(Text, { style: [styles.headerCell, styles.colStatus] }, "Status"),
          createElement(Text, { style: [styles.headerCell, styles.colVolume] }, "Annual Volume"),
          createElement(Text, { style: [styles.headerCell, styles.colTier] }, "Tier"),
          createElement(Text, { style: [styles.headerCell, styles.colRate] }, "Rate"),
          createElement(Text, { style: [styles.headerCell, styles.colSavings] }, "Savings"),
          createElement(Text, { style: [styles.headerCell, styles.colDate] }, "Date")
        ),
        // Rows
        ...rows.map((row, i) =>
          createElement(
            View,
            { key: i, style: [styles.row, i % 2 === 1 ? styles.rowAlt : {}] },
            createElement(Text, { style: [styles.cell, styles.colMerchant] }, row.merchantName),
            createElement(Text, { style: [styles.cell, styles.colHotel] }, row.hotelGroup || "—"),
            createElement(Text, { style: [styles.cell, styles.colStatus] }, row.status),
            createElement(Text, { style: [styles.cell, styles.colVolume] }, row.annualVolume),
            createElement(Text, { style: [styles.cell, styles.colTier] }, row.tier),
            createElement(Text, { style: [styles.cell, styles.colRate] }, row.rate ? `${row.rate} bps` : "—"),
            createElement(Text, { style: [styles.cell, styles.colSavings] }, row.savings || "—"),
            createElement(Text, { style: [styles.cell, styles.colDate] }, row.date)
          )
        )
      ),
      createElement(Text, { style: styles.footer }, "Banyan Payment Gateway — Confidential")
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success: rateLimitOk } = rateLimit(`export-deals-pdf:${session.userId}`, 5, 60000);
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

    const dealRows = await db
      .select()
      .from(deals)
      .where(whereClause)
      .orderBy(desc(deals.createdAt))
      .limit(500);

    const rows: DealRow[] = dealRows.map((d) => {
      const pr = d.pricingResult as Record<string, unknown> | null;
      return {
        merchantName: d.merchantName,
        hotelGroup: d.hotelGroup,
        status: d.status,
        annualVolume: fmtCurrency(Number(d.annualVolume)),
        tier: getTierLabel(d.annualVolume),
        rate: pr ? String(Number(pr.adjustedRate ?? 0).toFixed(0)) : "",
        savings: pr ? fmtCurrency(Number(pr.annualSavings ?? 0)) : "",
        date: d.createdAt.toISOString().split("T")[0],
      };
    });

    const generatedAt = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(createElement(DealsReport, { rows, generatedAt }) as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="deals-export-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF deals export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
