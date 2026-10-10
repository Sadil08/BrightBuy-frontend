// Server Component / Route Handler helper for "who is the current user" — never imported by a
// Client Component (nothing here is marked "use client", and it calls next/headers' cookies(),
// which throws if called from client code anyway, so misuse fails loudly rather than silently).
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, type UserProfile } from "@/lib/api-client/auth";
import { toolRoles } from "@/lib/admin/tools";

// Turns the current request's own cookies into a raw "name=value; name2=value2" string, suitable
// for the Cookie header on a server-to-server fetch to the backend. Next.js's cookies() gives you
// read access to the BROWSER's incoming cookies here — it does NOT automatically attach them to any
// fetch call you make, that's something every outgoing backend request has to do explicitly.
export async function cookieHeaderFromRequest(): Promise<string> {
  const store = await cookies();
  return store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
}

// getSession() is THE way any Server Component learns who's logged in — wrapped in React's cache()
// so multiple components in one render tree (the layout's nav AND a page body, say) share one
// backend call instead of each hitting /auth/me separately for what is, within a single request,
// always the same answer.
export const getSession = cache(async (): Promise<UserProfile | null> => {
  const cookieHeader = await cookieHeaderFromRequest();
  if (!cookieHeader) return null;
  return getCurrentUser(cookieHeader);
});

// requireUser/requireAdmin are the REAL authorization checks — "close to the data," per Next.js's
// own Data Access Layer guidance, as opposed to proxy.ts's merely-optimistic cookie-presence check.
// Call these at the top of any protected Server Component page, not just proxy.ts's redirect: proxy
// only knows "a cookie exists," these actually ask the backend "is this session genuinely valid
// right now" (an expired-but-still-cookied session, or one revoked by an admin, fails HERE).
export async function requireUser(): Promise<UserProfile> {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// requireAdmin is a deliberately COARSE check: role === "ADMIN", not "does this account currently
// hold account:manage_users/account:manage_roles." The backend's dynamic RBAC means a different role
// could theoretically be granted those permissions at runtime, and this check wouldn't know — but
// UserProfile (GET /auth/me) only ever returns a role name, never the resolved permission list (that
// lives solely in the access token's own JWT claims, which this app never decodes — it has no reason
// to, and no signing key to verify one even if it wanted to). This is exactly
// specs/global/02_SECURITY_BASELINE.md §1's own framing: "hiding a button is presentation, not
// access control" — showing/hiding the admin console here is a UX nicety; the backend's
// RequirePermission middleware is the actual, only, enforcement point. A non-ADMIN who somehow
// reaches an admin page still gets a real 403 from the backend on any actual action.
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

// requireStaff admits ANY non-customer account to the staff console shell (warehouse staff, order
// managers, managers, admins). Like requireAdmin it is a coarse, UX-level gate: what each role can
// actually DO is enforced by the backend's per-permission checks, and each console page narrows
// further for itself (the users and roles pages call requireAdmin; inventory calls requireInventoryAccess).
export async function requireStaff(): Promise<UserProfile> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") {
    redirect("/");
  }
  return user;
}

// Gate for a console tool, driven by the same registry the sidebar uses (lib/admin/tools.ts): one
// source of truth for "which roles see this tool". Coarse and UX-level — the profile only carries a
// role name — while the backend's RequirePermission is the real enforcement.
export async function requireToolAccess(href: string): Promise<UserProfile> {
  const user = await requireStaff();
  if (!(toolRoles(href) as readonly string[]).includes(user.role)) {
    redirect("/admin");
  }
  return user;
}

export const requireInventoryAccess = () => requireToolAccess("/admin/inventory");
