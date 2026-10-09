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
      className="card p-5"
    >
      <input type="hidden" name="roleId" value={role.roleId} />
      <h3 className="text-lg font-extrabold">{role.name}</h3>

      {role.name === "ADMIN" && (
        <p className="mt-1 text-xs text-ink-faint">
          AC-AUTH-7: saving this is accepted, for display consistency — but ADMIN bypasses this list
          entirely (SEC-AUTH-1), so it has no actual effect on what an ADMIN account can do.
        </p>
      )}

      {state.error && (
        <p role="alert" className="alert alert-bad mt-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="alert alert-good mt-3">
          Saved.
        </p>
      )}

      {/* defaultChecked, not checked: this is an uncontrolled form on purpose — the role's CURRENT
          grants are the initial state, and the user's in-progress edits before saving are the
          browser's own concern, not something this component needs to track in React state. */}
      <div className="mt-3 flex flex-wrap gap-4">
        {permissions.map((permission) => (
          <label key={permission.permissionId} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--action)]"
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
        className="btn btn-primary btn-sm mt-4"
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
