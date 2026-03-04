import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teamSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
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

    await db
      .update(teamSettings)
      .set({ anthropicApiKey: apiKey || null, updatedAt: new Date() })
      .where(eq(teamSettings.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
