"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { AlertIcon } from "@/components/icons";

const initialState: AuthFormState = {};

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="alert alert-bad items-center">
          <AlertIcon /> {state.error}
        </p>
      )}

      <div>
        <label htmlFor="reg-name" className="label">Full name</label>
        <input id="reg-name" type="text" name="name" required autoComplete="name" className="input" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-email" className="label">Email</label>
          <input id="reg-email" type="email" name="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="reg-phone" className="label">Phone</label>
          <input id="reg-phone" type="tel" name="phone" required autoComplete="tel" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="reg-password" className="label">Password</label>
        {/* minLength={8} here is UX only: it avoids a pointless round trip for a too-short password.
            The backend's own validation (FR-AUTH-7) is the actual control. */}
        <input id="reg-password" type="password" name="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="hint">At least 8 characters.</p>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
