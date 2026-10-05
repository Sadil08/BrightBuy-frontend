"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

// useActionState wires this form directly to the loginAction Server Action: submitting runs the
// action on the SERVER (loginAction itself is server-only, never bundled to the browser), and
// whatever it returns ({error: "..."} or nothing, on success + redirect) becomes `state` here,
// re-rendering this component with that result — no manual fetch(), no client-side state management
// for the request lifecycle at all. `pending` is true for the duration of that server round trip,
// letting the submit button disable itself without a separate useState.
export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {state.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
