import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, teamSettings, loginAttempts } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { getClientIp } from "@/lib/request-ip";

const LOCKOUT_WINDOW_MS = 30 * 60 * 1000;
const LOCKOUT_THRESHOLD = 10;

/**
 * Step 1 of login: validate the team invite code, then send a one-time code
 * to the supplied e-mail address. No session is issued here — the session
 * cookie is only set by /api/auth/verify-otp once the e-mail OTP is verified,
 * so the invite code alone can never impersonate an existing account.
 */
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

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate limit: 5 attempts per minute per IP
    const { success: rateLimitOk } = rateLimit(`login:${ip}`, 5, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    // Lockout: 10 failed attempts in the last 30 minutes, keyed on the e-mail
    // AND on the client IP (so rotating e-mails does not bypass the lockout).
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);
    const [failedByEmail] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          gt(loginAttempts.createdAt, windowStart)
        )
      );
    const [failedByIp] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ip, ip),
          eq(loginAttempts.success, false),
          gt(loginAttempts.createdAt, windowStart)
        )
      );

    if (
      (failedByEmail && failedByEmail.count >= LOCKOUT_THRESHOLD) ||
      (ip !== "unknown" && failedByIp && failedByIp.count >= LOCKOUT_THRESHOLD)
    ) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 30 minutes." },
        { status: 429 }
      );
    }

    // Validate invite code — compare against every team's bcrypt hash.
    const allTeams = await db.select().from(teamSettings);

    let matchedTeam = null;
    for (const team of allTeams) {
      const isHashed = team.inviteCode.startsWith("$2");

      if (isHashed) {
        if (await bcrypt.compare(inviteCode, team.inviteCode)) {
          matchedTeam = team;
          break;
        }
        continue;
      }

      // Legacy plaintext row: accept once, then hash it in place so the
      // plaintext code is no longer stored at rest.
      if (inviteCode === team.inviteCode) {
        const hashed = await bcrypt.hash(inviteCode, 10);
        await db
          .update(teamSettings)
          .set({ inviteCode: hashed, updatedAt: new Date() })
          .where(eq(teamSettings.id, team.id));
        console.warn(`Upgraded plaintext invite code to bcrypt for team ${team.id}`);
        matchedTeam = team;
        break;
      }
    }

    if (!matchedTeam) {
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

    // Per-e-mail throttle on OTP issuance (3 codes per 10 minutes)
    const { success: otpIssueOk } = rateLimit(`otp-issue:${user.email}`, 3, 10 * 60 * 1000);
    if (!otpIssueOk) {
      return NextResponse.json(
        { error: "A code was already sent. Please wait a few minutes before requesting another." },
        { status: 429 }
      );
    }

    // Generate OTP and send via e-mail. Success is logged in verify-otp.
    const otpCode = await createOtp(user.id, user.email);
    try {
      await sendOtpEmail(user.email, otpCode, user.name);
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unable to send verification code. Please try again later or contact your administrator." },
          { status: 503 }
        );
      }
      // Local development without SMTP: surface the code in the server log only.
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
