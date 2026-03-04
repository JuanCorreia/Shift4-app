import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teamSettings } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { inviteCode, name, email } = parsed.data;

    // Validate invite code against team_settings (plain-text match)
    const team = await db
      .select()
      .from(teamSettings)
      .where(eq(teamSettings.inviteCode, inviteCode))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 401 }
      );
    }

    // Find existing user or create new one
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user;

    if (existingUser.length > 0) {
      // Update existing user
      const updated = await db
        .update(users)
        .set({ name, inviteCode, updatedAt: new Date() })
        .where(eq(users.email, email))
        .returning();
      user = updated[0];
    } else {
      // Create new user
      const created = await db
        .insert(users)
        .values({ name, email, inviteCode, role: "analyst" })
        .returning();
      user = created[0];
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
