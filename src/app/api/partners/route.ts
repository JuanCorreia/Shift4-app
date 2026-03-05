import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partners, teamSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allPartners = await db.select().from(partners).orderBy(partners.createdAt);
    return NextResponse.json(allPartners);
  } catch (error) {
    console.error("List partners error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, logoUrl, inviteCode } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await db
      .select()
      .from(partners)
      .where(eq(partners.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A partner with this slug already exists" },
        { status: 409 }
      );
    }

    const [partner] = await db
      .insert(partners)
      .values({ name, slug, logoUrl: logoUrl || null })
      .returning();

    // Create team_settings for the new partner
    const code = inviteCode || `${slug}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(teamSettings).values({
      partnerId: partner.id,
      inviteCode: code,
      teamName: name,
    });

    return NextResponse.json({ ...partner, inviteCode: code }, { status: 201 });
  } catch (error) {
    console.error("Create partner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
