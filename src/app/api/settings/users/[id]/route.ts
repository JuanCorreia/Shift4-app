import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

const VALID_ROLES = ["analyst", "admin", "viewer"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, role, active } = body;

    // Verify user exists and belongs to same partner
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (session.role !== "super_admin" && targetUser.partnerId !== session.partnerId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating yourself
    if (id === session.userId && active === false) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (name !== undefined && typeof name === "string" && name.trim().length >= 2) {
      updates.name = name.trim();
      changes.name = { old: targetUser.name, new: name.trim() };
    }

    if (email !== undefined && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email) {
        // Check uniqueness
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);
        if (existing.length > 0) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
        updates.email = normalizedEmail;
        changes.email = { old: targetUser.email, new: normalizedEmail };
      }
    }

    if (role !== undefined && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      updates.role = role;
      changes.role = { old: targetUser.role, new: role };
    }

    if (active !== undefined && typeof active === "boolean") {
      updates.active = active;
      changes.active = { old: targetUser.active, new: active };
    }

    await db.update(users).set(updates).where(eq(users.id, id));

    await logAuditEvent({
      userId: session.userId,
      action: "user_updated",
      resource: "users",
      resourceId: id,
      details: changes,
      ip: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
