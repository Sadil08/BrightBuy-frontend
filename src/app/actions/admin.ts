"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createStaffAccount,
  setRolePermissions,
  refresh,
  ApiError,
} from "@/lib/api-client/auth";
import { parseSetCookie } from "@/lib/api-client/cookie-utils";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

async function persistCookies(setCookies: string[]): Promise<void> {
  const store = await cookies();
  for (const raw of setCookies) {
    const { name, value, ...options } = parseSetCookie(raw);
    store.set(name, value, options);
  }
}

// withSilentRefresh is T11's "silent-refresh-on-401" behavior — deliberately scoped to Server
// Actions, never proxy.ts (see proxy.ts's own comment for the prefetch/token-rotation race that
// makes a proxy-level refresh actively dangerous). A Server Action only ever runs from one explicit
// form submission, never speculative prefetching, so retrying once after a transparent refresh here
// can't race against another copy of itself the way a prefetched navigation could.
async function withSilentRefresh<T>(call: (cookieHeader: string) => Promise<T>): Promise<T> {
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

  // Build the retry's Cookie header directly from the refresh response's own values, rather than
  // re-reading cookies() — whether a just-written cookies().set() is visible to an immediate
  // cookies().getAll() within the same Server Action isn't something to depend on without
  // verifying, and the only two cookies that matter here are exactly the ones this response just
  // replaced anyway.
  const refreshedCookieHeader = refreshed.setCookies
    .map((raw) => {
      const parsed = parseSetCookie(raw);
      return `${parsed.name}=${parsed.value}`;
    })
    .join("; ");

  return call(refreshedCookieHeader);
}

export interface CreateStaffFormState {
  error?: string;
  success?: boolean;
}

export async function createStaffAccountAction(
  _prevState: CreateStaffFormState,
  formData: FormData,
): Promise<CreateStaffFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const roleId = Number(formData.get("roleId"));

  try {
    await withSilentRefresh((cookieHeader) =>
      createStaffAccount(cookieHeader, { name, email, password, roleId }),
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // Re-renders the users list Server Component with fresh data, without a full page reload — the
  // whole point of calling this instead of just letting the stale list sit there until next visit.
  revalidatePath("/admin/users");
  return { success: true };
}

export interface SetRolePermissionsFormState {
  error?: string;
  success?: boolean;
}

export async function setRolePermissionsAction(
  _prevState: SetRolePermissionsFormState,
  formData: FormData,
): Promise<SetRolePermissionsFormState> {
  const roleId = Number(formData.get("roleId"));
  // Checkboxes sharing one `name="permissionCodes"`: getAll returns one value per CHECKED box,
  // nothing for unchecked ones — exactly RolePermissionsUpdateRequest's "full replacement set"
  // shape, no extra assembly needed.
  const permissionCodes = formData.getAll("permissionCodes").map(String);

  try {
    await withSilentRefresh((cookieHeader) => setRolePermissions(cookieHeader, roleId, permissionCodes));
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/roles");
  return { success: true };
}
