import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}
const COOKIE_NAME = "shift4_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

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

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS,
    path: "/",
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}
