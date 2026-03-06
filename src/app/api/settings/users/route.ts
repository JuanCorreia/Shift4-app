import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

const VALID_ROLES = ["analyst", "admin", "viewer"] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, partnerId: bodyPartnerId } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required (min 2 chars)" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Determine partner: super_admin can pick, admin uses own
    const targetPartnerId =
      session.role === "super_admin" && bodyPartnerId
        ? bodyPartnerId
        : session.partnerId;

    if (!targetPartnerId) {
      return NextResponse.json({ error: "No partner assigned" }, { status: 400 });
    }

    const [created] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as (typeof VALID_ROLES)[number],
        partnerId: targetPartnerId,
      })
      .returning();

    await logAuditEvent({
      userId: session.userId,
      action: "user_created",
      resource: "users",
      resourceId: created.id,
      details: { name: created.name, email: created.email, role: created.role },
      ip: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, user: created });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
