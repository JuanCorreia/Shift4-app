import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate limiting and audit logging.
 *
 * Order of preference:
 *  1. `request.ip` — populated by the platform (Vercel) from the socket, not spoofable.
 *  2. Last hop of `x-forwarded-for` — the value appended by the nearest trusted proxy.
 *     (Earlier hops are attacker-controlled and must not be trusted.)
 *  3. `x-real-ip` — set by common reverse proxies (nginx, Caddy).
 */
export function getClientIp(request: NextRequest): string {
  const platformIp = (request as NextRequest & { ip?: string }).ip;
  if (platformIp) return platformIp;

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
