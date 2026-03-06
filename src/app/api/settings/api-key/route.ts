import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { teamSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { encrypt } from "@/lib/crypto";
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
    const { apiKey, teamId } = body;

    if (typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key must be a string" },
        { status: 400 }
      );
    }

    if (!teamId || typeof teamId !== "string") {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Scope to partner unless super_admin
    if (!session.partnerId && session.role !== "super_admin") {
      return NextResponse.json({ error: "No partner assigned" }, { status: 403 });
    }
    const conditions = session.role === "super_admin"
      ? eq(teamSettings.id, teamId)
      : and(eq(teamSettings.id, teamId), eq(teamSettings.partnerId, session.partnerId!));

    const [existing] = await db.select().from(teamSettings).where(conditions);
    if (!existing) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Encrypt API key before storing if ENCRYPTION_KEY is set
    let storedKey: string | null = null;
    if (apiKey) {
      storedKey = process.env.ENCRYPTION_KEY ? encrypt(apiKey) : apiKey;
    }

    await db
      .update(teamSettings)
      .set({ anthropicApiKey: storedKey, updatedAt: new Date() })
      .where(eq(teamSettings.id, teamId));

    await logAuditEvent({
      userId: session.userId,
      action: apiKey ? "api_key_updated" : "api_key_removed",
      resource: "team_settings",
      resourceId: teamId,
      ip: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
