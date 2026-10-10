// Typed functions for 02-auth's backend endpoints — same hand-written-against-openapi.yaml approach
// as catalog.ts. The one thing genuinely different about this file: register/login/refresh/logout
// below all need to read the backend's raw Set-Cookie response headers, so a Server Action
// (src/app/actions/auth.ts, src/app/actions/admin.ts) can re-emit them as real browser cookies via
// next/headers' cookies().set() — a server-to-server call's Set-Cookie headers never reach the
// browser on their own otherwise.
//
// Those four functions deliberately do NOT use the standard `fetch()` API — a real bug, found and
// fixed while building this file, is why: the Fetch spec classifies Set-Cookie as a "forbidden
// response-header name," stripped from a Response's `headers` for EVERY caller of fetch(), not just
// browser pages — confirmed directly, Node's fetch() hid it here even server-side, while Node's
// lower-level `http`/`https` module (rawRequest, below) exposed it correctly on the exact same
// request. This isn't a Next.js quirk; it's fetch() itself. apiFetch (index.ts) and every OTHER
// function in this file stay on plain fetch() — they only ever SEND a Cookie header, never need to
// READ one back, so the limitation above never applies to them.

import * as http from "node:http";
import * as https from "node:https";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Must match shared/auth.AccessTokenCookie/RefreshTokenCookie on the Go side exactly — there's no
// way to import a Go constant into TypeScript, so this is the one place on the frontend that has to
// be kept in sync by hand if those names ever change.
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// One ApiError for the whole client layer (defined in index.ts) so `instanceof` checks work no matter
// which module threw. Re-exported here because earlier code imports it from this file.
import { ApiError } from "./index";
export { ApiError };

export interface UserProfile {
  userId: number;
  customerId?: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "WAREHOUSE_STAFF" | "ORDER_MANAGER" | "MANAGER" | "ADMIN";
}

export interface Role {
  roleId: number;
  name: string;
  permissions: string[];
}

export interface Permission {
  permissionId: number;
  code: string;
  description: string;
}

export interface Page {
  page: number;
  size: number;
  total: number;
}

export interface UserList {
  items: UserProfile[];
  page: Page;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateAccountInput {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

// AuthResult pairs the parsed response body with whatever Set-Cookie headers the backend sent.
export interface AuthResult {
  profile: UserProfile;
  setCookies: string[];
}

interface RawResponse {
  status: number;
  body: string;
  setCookies: string[];
}

// rawRequest is a minimal, auth.ts-only HTTP client built on Node's http/https module specifically
// to get real access to Set-Cookie — see this file's top comment for why fetch() can't do this job.
// It's intentionally small: no retries, no streaming, nothing fetch() already does well for the rest
// of the app — just enough to make one request and read back its status/body/cookies.
function rawRequest(path: string, options: { method: string; headers: Record<string, string>; body?: string }): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/api/v1${path}`);
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf-8"),
            // Node's http module gives repeated Set-Cookie headers as a real array already — no
            // getSetCookie()-style accessor needed, this is just how res.headers.set-cookie works.
            setCookies: res.headers["set-cookie"] ?? [],
          });
        });
      },
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function parseErrorBody(body: string, status: number): { code: string; message: string } {
  try {
    const parsed = JSON.parse(body);
    return { code: parsed.code ?? "UNKNOWN", message: parsed.message ?? `HTTP ${status}` };
  } catch {
    return { code: "UNKNOWN", message: `HTTP ${status}` };
  }
}

async function authRequest(path: string, method: string, body?: unknown, cookieHeader?: string): Promise<AuthResult> {
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bodyStr) headers["Content-Length"] = String(Buffer.byteLength(bodyStr));
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  const res = await rawRequest(path, { method, headers, body: bodyStr });

  if (res.status < 200 || res.status >= 300) {
    const { code, message } = parseErrorBody(res.body, res.status);
    throw new ApiError(res.status, code, message);
  }

  return { profile: JSON.parse(res.body) as UserProfile, setCookies: res.setCookies };
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return authRequest("/auth/register", "POST", input);
}

export function login(input: LoginInput): Promise<AuthResult> {
  return authRequest("/auth/login", "POST", input);
}

// refresh/logout take the INCOMING request's own Cookie header value (forwarded verbatim) rather
// than reading cookies themselves — this file has no idea it's running inside Next.js at all, it's
// just a thin wrapper around the backend's HTTP contract; reading the actual browser request is the
// caller's job (a Server Action, via next/headers).

export async function refresh(cookieHeader: string): Promise<AuthResult | null> {
  const res = await rawRequest("/auth/refresh", { method: "POST", headers: { Cookie: cookieHeader } });
  if (res.status < 200 || res.status >= 300) {
    return null; // refresh token missing/expired/revoked — not exceptional, just "couldn't"
  }
  return { profile: JSON.parse(res.body) as UserProfile, setCookies: res.setCookies };
}

export async function logout(cookieHeader: string): Promise<string[]> {
  const res = await rawRequest("/auth/logout", { method: "POST", headers: { Cookie: cookieHeader } });
  return res.setCookies;
}

// --- Everything below stays on plain fetch() — these only ever SEND a Cookie header, never need to
// read one back, so fetch()'s Set-Cookie filtering (this file's whole reason for existing above)
// never applies to them.

export async function getCurrentUser(cookieHeader: string): Promise<UserProfile | null> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!res.ok) {
    return null; // not authenticated — every caller treats this as "logged out," not an error
  }
  return (await res.json()) as UserProfile;
}

export async function createStaffAccount(cookieHeader: string, input: CreateAccountInput): Promise<UserProfile> {
  const res = await fetch(`${BACKEND_URL}/api/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
  }
  return (await res.json()) as UserProfile;
}

export async function listUsers(cookieHeader: string, page?: number, size?: number): Promise<UserList> {
  const query = new URLSearchParams();
  if (page !== undefined) query.set("page", String(page));
  if (size !== undefined) query.set("size", String(size));
  const queryString = query.toString();

  const res = await fetch(`${BACKEND_URL}/api/v1/admin/users${queryString ? `?${queryString}` : ""}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
  }
  return (await res.json()) as UserList;
}

export async function listRoles(cookieHeader: string): Promise<Role[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/admin/roles`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
  }
  return (await res.json()) as Role[];
}

export async function listPermissions(cookieHeader: string): Promise<Permission[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/admin/permissions`, { headers: { Cookie: cookieHeader }, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
  }
  return (await res.json()) as Permission[];
}

export async function setRolePermissions(cookieHeader: string, roleId: number, permissionCodes: string[]): Promise<Role> {
  const res = await fetch(`${BACKEND_URL}/api/v1/admin/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ permissionCodes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
  }
  return (await res.json()) as Role;
}
