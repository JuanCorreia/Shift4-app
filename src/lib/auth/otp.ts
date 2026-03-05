import crypto from "crypto";
import { db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

const OTP_EXPIRY_MINUTES = 10;

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function createOtp(userId: string, email: string): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(otpCodes).values({
    userId,
    email,
    code,
    expiresAt,
  });

  return code;
}

export async function verifyOtp(email: string, code: string): Promise<{ valid: boolean; userId: string | null }> {
  const now = new Date();

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, now)
      )
    )
    .limit(1);

  if (!otp) {
    return { valid: false, userId: null };
  }

  // Mark as used
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, otp.id));

  return { valid: true, userId: otp.userId };
}
