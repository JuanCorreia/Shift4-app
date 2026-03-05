import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, partners } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Rate limit OTP verification: 5 attempts per minute per email
    const { success: rateLimitOk } = rateLimit(`otp:${email}`, 5, 60000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a minute." },
        { status: 429 }
      );
    }

    const { valid, userId } = await verifyOtp(email, code.trim());

    if (!valid || !userId) {
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

    // Create session
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
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
