// Silent-refresh-on-401 for Server Actions (T11). Deliberately scoped to Server Actions, never
// proxy.ts: a proxy-level refresh can race a prefetch and trip refresh-token reuse detection (see
// src/proxy.ts). A Server Action only runs from one explicit submit, so retrying once is safe.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "@/lib/api-client/auth";
import { ApiError } from "@/lib/api-client";
import { parseSetCookie } from "@/lib/api-client/cookie-utils";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

async function persistCookies(setCookies: string[]): Promise<void> {
  const store = await cookies();
  for (const raw of setCookies) {
    const { name, value, ...options } = parseSetCookie(raw);
    store.set(name, value, options);
  }
}

export async function withSilentRefresh<T>(call: (cookieHeader: string) => Promise<T>): Promise<T> {
  const initialCookieHeader = await cookieHeaderFromRequest();
  try {
    return await call(initialCookieHeader);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err; // 403 (wrong permission), 400, etc. — a refresh wouldn't fix any of these
    }
  }

  const refreshed = await refresh(initialCookieHeader);
  if (!refreshed) {
    redirect("/login"); // the refresh token itself is gone/expired/revoked too — nothing left to try
  }
  await persistCookies(refreshed.setCookies);

  // Build the retry's Cookie header from the refresh response itself rather than re-reading cookies():
  // whether a just-written cookie is visible to an immediate read in the same action isn't guaranteed.
  const refreshedCookieHeader = refreshed.setCookies
    .map((raw) => {
      const parsed = parseSetCookie(raw);
      return `${parsed.name}=${parsed.value}`;
    })
    .join("; ");

  return call(refreshedCookieHeader);
}
