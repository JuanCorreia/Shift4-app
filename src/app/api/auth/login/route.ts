import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teamSettings, partners } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/auth/session";

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

    // Rate limit: 5 attempts per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success: rateLimitOk } = rateLimit(ip, 5, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    // Validate invite code against team_settings
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

    // Resolve partner from team_settings
    const partnerId = team[0].partnerId;

    // Find existing user or create new one
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];
      // Update partner_id if not set (backfill existing users)
      if (!user.partnerId) {
        await db
          .update(users)
          .set({ partnerId, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        user = { ...user, partnerId };
      }
    } else {
      const created = await db
        .insert(users)
        .values({ name, email, inviteCode, partnerId, role: "analyst" })
        .returning();
      user = created[0];
    }

    // Resolve partner name
    let partnerName: string | undefined;
    if (user.partnerId) {
      const [partner] = await db
        .select({ name: partners.name })
        .from(partners)
        .where(eq(partners.id, user.partnerId))
        .limit(1);
      partnerName = partner?.name;
    }

    // Create session directly (MFA disabled)
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
      partnerName,
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
