import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

const VALID_ROLES = ["analyst", "admin", "viewer"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin" && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: analyst, admin, viewer" },
        { status: 400 }
      );
    }

    // Verify user belongs to same partner (unless super_admin)
    if (session.role !== "super_admin" && session.partnerId) {
      const [targetUser] = await db
        .select({ partnerId: users.partnerId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!targetUser || targetUser.partnerId !== session.partnerId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    await db
      .update(users)
      .set({ role: role as (typeof VALID_ROLES)[number], updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
