// Next.js 16 renamed "Middleware" to "Proxy" (functionality unchanged) — this file is the direct
// equivalent of what older Next.js docs/tutorials call `middleware.ts`.
//
// DELIBERATELY optimistic-only: this checks cookie PRESENCE, nothing more — no call to the backend,
// no decoding the JWT. Next.js's own guidance is explicit about why: proxy runs on every request,
// including speculative <Link> prefetches the user may never actually follow, so anything here has
// to be cheap and side-effect-free. A proactive "refresh the token here if it looks expired" was
// considered and deliberately rejected: our refresh token ROTATES on every use (plan.md §6), and a
// prefetch-triggered refresh racing a real navigation's own refresh would present an
// already-rotated token to the backend — which treats that as a theft signal and revokes the
// account's ENTIRE session (shared/auth's reuse-detection). A proxy-triggered refresh could log a
// user out by prefetching a link. The actual silent-refresh-after-401 behavior lives in
// src/app/actions/auth.ts's Server Actions instead, which only ever run from a real, explicit form
// submission — never a prefetch.
//
// "access_token present" is also a reasonable proxy for "not yet expired," not just "exists": the
// backend sets the cookie's own Max-Age equal to the JWT's TTL (shared/auth.SetAuthCookies), so the
// browser stops sending it at almost exactly the moment the token itself would fail verification
// anyway.
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/api-client/auth";

const ADMIN_PREFIX = "/admin";
const AUTH_ONLY_PAGES = ["/login", "/register"]; // pointless to show a logged-in visitor a login form
const CUSTOMER_PREFIXES = ["/checkout", "/orders"]; // FR-CHECKOUT-20: only signed-in customers

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);
  const possiblyAuthenticated = hasAccessToken || hasRefreshToken;

  if (pathname.startsWith(ADMIN_PREFIX) && !possiblyAuthenticated) {
    // Optimistic only — this does NOT check the ADMIN role or any permission (that needs a verified
    // JWT/backend call, which doesn't belong here). A CUSTOMER with cookies still reaches this far;
    // the real authorization check is in the admin pages themselves (src/app/(admin)/admin/*), via
    // the Data Access Layer pattern (src/lib/auth/session.ts) — "close to the data," not in proxy.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (CUSTOMER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !possiblyAuthenticated) {
    // Same optimistic cookie-presence check as above. The real checks (valid session, CUSTOMER role)
    // run in the pages themselves. `next` brings the visitor straight back after logging in.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_PAGES.includes(pathname) && hasAccessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static assets — no auth-relevant decision ever depends on those, and
  // running on every one would just be wasted work on every single request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
