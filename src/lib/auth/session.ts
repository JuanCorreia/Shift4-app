import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}
const COOKIE_NAME = "shift4_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

export const SESSION_COOKIE = COOKIE_NAME;

/** Cookie attributes shared by every place that sets the session cookie. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SEVEN_DAYS,
    path: "/",
  };
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  partnerId: string | null;
  partnerName?: string;
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SEVEN_DAYS });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = createToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions());

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Returns the current session, or null.
 *
 * The JWT proves who logged in; role, partner and active flag are always
 * re-read from the database so that deactivating or demoting a user takes
 * effect immediately instead of when the 7-day token expires.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const [user] = await db
      .select({ active: users.active, role: users.role, partnerId: users.partnerId })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.active) return null;

    return { ...payload, role: user.role, partnerId: user.partnerId };
  } catch (error) {
    // Fail closed: without a reachable user record we cannot vouch for the session.
    console.error("Session validation error:", error);
    return null;
  }
}
