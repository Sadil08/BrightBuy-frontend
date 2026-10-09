"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { AlertIcon } from "@/components/icons";

const initialState: AuthFormState = {};

// useActionState wires this form directly to the loginAction Server Action: submitting runs the
// action on the SERVER (loginAction itself is server-only, never bundled to the browser), and
// whatever it returns ({error: "..."} or nothing, on success + redirect) becomes `state` here —
// no manual fetch(), no client-side state management for the request lifecycle at all. `pending`
// is true for the duration of that server round trip.
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="alert alert-bad items-center">
          <AlertIcon /> {state.error}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="label">Email</label>
        <input id="login-email" type="email" name="email" required autoComplete="email" className="input" />
      </div>

      <div>
        <label htmlFor="login-password" className="label">Password</label>
        <input id="login-password" type="password" name="password" required autoComplete="current-password" className="input" />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
