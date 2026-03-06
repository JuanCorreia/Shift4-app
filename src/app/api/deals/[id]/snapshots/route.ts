import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, pricingSnapshots } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { partnerFilter } from "@/lib/db/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify deal access (partner scoped)
    const pf = partnerFilter(session);
    const conditions = pf ? and(eq(deals.id, id), pf) : eq(deals.id, id);
    const [deal] = await db.select({ id: deals.id }).from(deals).where(conditions);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const snapshots = await db
      .select()
      .from(pricingSnapshots)
      .where(eq(pricingSnapshots.dealId, id))
      .orderBy(desc(pricingSnapshots.snapshotAt))
      .limit(50);

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Get snapshots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
