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
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <h2 className="text-lg font-extrabold">Create a staff account</h2>

      {state.error && (
        <p role="alert" className="alert alert-bad">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="alert alert-good">
          Account created.
        </p>
      )}

      <label className="block">
        <span className="label">Name</span>
        <input name="name" required className="input" />
      </label>

      <label className="block">
        <span className="label">Email</span>
        <input type="email" name="email" required className="input" />
      </label>

      <label className="block">
        <span className="label">Password</span>
        <input type="password" name="password" required minLength={8} className="input" />
      </label>

      <label className="block">
        <span className="label">Role</span>
        <select name="roleId" required className="input">
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
        className="btn btn-primary"
      >
        {pending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
