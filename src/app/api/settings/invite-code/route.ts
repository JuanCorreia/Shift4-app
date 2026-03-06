import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { teamSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/audit";

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
    const { inviteCode, teamId } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    if (!teamId || typeof teamId !== "string") {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify team belongs to user's partner (unless super_admin)
    if (session.role !== "super_admin" && !session.partnerId) {
      return NextResponse.json({ error: "No partner assigned" }, { status: 403 });
    }
    const updateCondition =
      session.role === "super_admin"
        ? eq(teamSettings.id, teamId)
        : and(eq(teamSettings.id, teamId), eq(teamSettings.partnerId, session.partnerId!));

    // Hash invite code before storing
    const hashedCode = await bcrypt.hash(inviteCode, 10);

    await db
      .update(teamSettings)
      .set({ inviteCode: hashedCode, updatedAt: new Date() })
      .where(updateCondition);

    await logAuditEvent({
      userId: session.userId,
      action: "invite_code_updated",
      resource: "team_settings",
      resourceId: teamId,
      ip: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update invite code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
