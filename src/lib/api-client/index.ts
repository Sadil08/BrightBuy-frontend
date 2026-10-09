// The ONE place that knows how to call the backend. Every feature adds its typed functions here
// (or in a file this one re-exports) instead of calling fetch() directly from a component — so a
// backend contract change (see ../../../../specs/openapi/openapi.yaml) is a one-file fix
// (specs/global/01_TECH_STACK.md §3: "one central typed API client").
//
// BACKEND_URL has no NEXT_PUBLIC_ prefix, so it's server-only — never inlined into the browser
// bundle. Server Components and Route Handlers can read it directly; anything that needs to call
// the backend from the BROWSER (a client component) goes through a Route Handler here instead,
// which then uses this same server-side BACKEND_URL. That keeps the backend's real address (and
// any server-only credential added later) out of client-side JavaScript entirely.

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    // The parsed JSON error body, kept whole so callers can read extra fields the backend adds to
    // some errors (e.g. checkout's 409 STOCK_EXCEEDED carries `unavailableLines`).
    public body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// A thin wrapper other feature modules build on. Not exported as a "call anything" escape hatch —
// each feature should add its own typed function (e.g. `getProduct(id: number): Promise<Product>`)
// rather than sprinkling raw apiFetch calls through components.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText, body);
  }

  return res.json() as Promise<T>;
}
