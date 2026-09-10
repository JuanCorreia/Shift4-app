import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/auth"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

/**
 * CSRF guard for JSON API routes: a browser always sends Origin on
 * cross-origin requests, so a mismatching Origin is rejected. Requests
 * without an Origin (same-origin fetches in some browsers, curl) pass and
 * still need a valid session cookie.
 */
function isCrossOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Reject cross-origin state-changing API calls (including /api/auth)
  if (isApi && !SAFE_METHODS.has(request.method) && isCrossOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and known static extensions
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/") ||
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("shift4_session")?.value;

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fail closed: without a signing secret no session can be trusted
  const secret = getSecret();
  if (!secret) {
    console.error("JWT_SECRET is not set - refusing to serve authenticated routes");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify JWT using jose (Edge-compatible)
  try {
    await jwtVerify(token, secret);
  } catch {
    const response = isApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("shift4_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
