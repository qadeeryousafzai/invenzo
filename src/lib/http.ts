import { NextResponse } from "next/server";

/**
 * Resolve the public origin(s) the application is served from.
 *
 * Behind a reverse proxy (e.g. Hostinger), `request.url` reflects the internal
 * host, so we must trust proxy headers and the configured public URL instead.
 * Precedence:
 *   1. APP_URL / AUTH_URL (canonical public origin) — most reliable.
 *   2. x-forwarded-host + x-forwarded-proto (set by the proxy).
 *   3. request.url origin (direct / local dev).
 */
function getExpectedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();

  // 1. Configured canonical public origin.
  const configured = process.env.APP_URL ?? process.env.AUTH_URL;
  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      /* ignore malformed env value */
    }
  }

  // 2. Proxy headers (Hostinger, nginx, etc.).
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) {
      const proto = forwardedProto.split(",")[0]?.trim() || "https";
      try {
        origins.add(new URL(`${proto}://${host}`).origin);
      } catch {
        /* ignore malformed host */
      }
    }
  }

  // 3. Direct request URL (local dev / no proxy).
  try {
    origins.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }

  return origins;
}

export function originIsAllowed(request: Request) {
  const origin = request.headers.get("origin");
  // Non-browser clients (no Origin header) are allowed through; CSRF protection
  // for these routes relies on the session/JWT auth check that follows.
  if (!origin) return true;
  try {
    const requestOrigin = new URL(origin).origin;
    return getExpectedOrigins(request).has(requestOrigin);
  } catch {
    return false;
  }
}

export function originError() {
  return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
}