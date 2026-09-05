import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, partners, loginAttempts } from "@/lib/db/schema";
import { createToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

/**
 * Step 2 of login: verify the e-mailed one-time code. This is the ONLY place
 * a session cookie is issued.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (typeof email !== "string" || typeof code !== "string" || !email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate limit OTP verification: 5 attempts per minute per e-mail and per IP
    const { success: emailLimitOk } = rateLimit(`otp:${email}`, 5, 60000);
    const { success: ipLimitOk } = rateLimit(`otp-ip:${ip}`, 20, 60000);
    if (!emailLimitOk || !ipLimitOk) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    const { valid, userId } = await verifyOtp(email, code.trim());

    if (!valid || !userId) {
      await db.insert(loginAttempts).values({ email, ip, userAgent, success: false });
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      );
    }

    // Get user details for session
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Block deactivated users
    if (!user.active) {
      return NextResponse.json(
        { error: "Account deactivated. Contact your administrator." },
        { status: 403 }
      );
    }

    // Log successful login (after OTP verified)
    await db.insert(loginAttempts).values({
      email: user.email,
      ip,
      userAgent,
      success: true,
    });

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

    // Create session token and set cookie on the response object
    // (cookies().set() from next/headers does not propagate in route handlers).
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
      partnerName,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
