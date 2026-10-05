"use client";

import { useActionState } from "react";
import { setRolePermissionsAction, type SetRolePermissionsFormState } from "@/app/actions/admin";
import type { Role, Permission } from "@/lib/api-client/auth";

const initialState: SetRolePermissionsFormState = {};

// One independent form (and one independent useActionState) PER ROLE — each role's permission set
// saves on its own, so editing WAREHOUSE_STAFF's grants doesn't require re-submitting every other
// role's checkboxes too, and a validation error on one role's save doesn't affect the others' state.
function RoleRow({ role, permissions }: { role: Role; permissions: Permission[] }) {
  const [state, formAction, pending] = useActionState(setRolePermissionsAction, initialState);

  return (
    <form
      action={formAction}
      className="rounded border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <input type="hidden" name="roleId" value={role.roleId} />
      <h3 className="font-medium">{role.name}</h3>

      {role.name === "ADMIN" && (
        <p className="mt-1 text-xs text-zinc-500">
          AC-AUTH-7: saving this is accepted, for display consistency — but ADMIN bypasses this list
          entirely (SEC-AUTH-1), so it has no actual effect on what an ADMIN account can do.
        </p>
      )}

      {state.error && (
        <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-2 rounded bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      {/* defaultChecked, not checked: this is an uncontrolled form on purpose — the role's CURRENT
          grants are the initial state, and the user's in-progress edits before saving are the
          browser's own concern, not something this component needs to track in React state. */}
      <div className="mt-3 flex flex-wrap gap-4">
        {permissions.map((permission) => (
          <label key={permission.permissionId} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="permissionCodes"
              value={permission.code}
              defaultChecked={role.permissions.includes(permission.code)}
            />
            {permission.code}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export function RolePermissionsMatrix({ roles, permissions }: { roles: Role[]; permissions: Permission[] }) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {roles.map((role) => (
        <RoleRow key={role.roleId} role={role} permissions={permissions} />
      ))}
    </div>
  );
}
