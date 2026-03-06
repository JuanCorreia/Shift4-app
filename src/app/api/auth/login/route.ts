import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, teamSettings, loginAttempts } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";

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

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate limit: 5 attempts per minute per IP
    const { success: rateLimitOk } = rateLimit(ip, 5, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    // Check lockout: 10 failed attempts in last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const [failedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          gt(loginAttempts.createdAt, thirtyMinAgo)
        )
      );

    if (failedCount && failedCount.count >= 10) {
      return NextResponse.json(
        { error: "Account temporarily locked due to too many failed attempts. Try again in 30 minutes." },
        { status: 429 }
      );
    }

    // Validate invite code — fetch all team settings and compare with bcrypt
    const allTeams = await db.select().from(teamSettings);

    let matchedTeam = null;
    for (const team of allTeams) {
      // Support both hashed and plaintext codes (backwards compat)
      const isHashed = team.inviteCode.startsWith("$2");
      const isMatch = isHashed
        ? await bcrypt.compare(inviteCode, team.inviteCode)
        : inviteCode === team.inviteCode;

      if (isMatch) {
        matchedTeam = team;
        break;
      }
    }

    if (!matchedTeam) {
      // Log failed attempt
      await db.insert(loginAttempts).values({
        email,
        ip,
        userAgent,
        success: false,
      });

      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 401 }
      );
    }

    const partnerId = matchedTeam.partnerId;

    // Find existing user or create new one
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];

      // Block deactivated users
      if (!user.active) {
        await db.insert(loginAttempts).values({ email, ip, userAgent, success: false });
        return NextResponse.json(
          { error: "Account deactivated. Contact your administrator." },
          { status: 403 }
        );
      }

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
        .values({ name, email, inviteCode: "used", partnerId, role: "analyst" })
        .returning();
      user = created[0];
    }

    // Note: success is logged after OTP verification, not here
    // Generate OTP and send via email
    const otpCode = await createOtp(user.id, user.email);
    try {
      await sendOtpEmail(user.email, otpCode, user.name);
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
      // In development / missing SMTP, log the code so login still works
      console.log(`[DEV] OTP code for ${user.email}: ${otpCode}`);
    }

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
