"use client";

import { useActionState } from "react";
import { createStaffAccountAction, type CreateStaffFormState } from "@/app/actions/admin";
import type { Role } from "@/lib/api-client/auth";

const initialState: CreateStaffFormState = {};

// roles excludes CUSTOMER entirely — there's no reason this form should ever offer it, since
// self-registration (AuthService.Register) is the ONLY way a CUSTOMER account gets created
// (FR-AUTH-9: this form exists specifically for the roles that have no other path in).
export function CreateStaffForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState(createStaffAccountAction, initialState);
  const staffRoles = roles.filter((r) => r.name !== "CUSTOMER");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">Create a staff account</h2>

      {state.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Account created.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Name</span>
        <input name="name" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
        <input type="email" name="email" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Password</span>
        <input type="password" name="password" required minLength={8} className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Role</span>
        <select name="roleId" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          {staffRoles.map((role) => (
            <option key={role.roleId} value={role.roleId}>
              {role.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
