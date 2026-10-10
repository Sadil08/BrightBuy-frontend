"use server";

import { revalidatePath } from "next/cache";
import {
  createStaffAccount,
  setRolePermissions,
  ApiError,
} from "@/lib/api-client/auth";
import { withSilentRefresh } from "@/lib/auth/with-silent-refresh";

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
