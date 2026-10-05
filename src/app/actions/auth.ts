"use server";

// Server Actions for the three things a BROWSER triggers directly: register, login, logout. This is
// the officially recommended Next.js pattern for auth forms (not a Client Component calling a Route
// Handler via fetch) — a Server Action runs on the server, can read/write cookies directly
// (next/headers' cookies().set()), and a plain <form action={loginAction}> works with JavaScript
// disabled, same progressive-enhancement reasoning as 01-catalog's search form.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { register, login, logout, ApiError } from "@/lib/api-client/auth";
import { parseSetCookie } from "@/lib/api-client/cookie-utils";
import { cookieHeaderFromRequest } from "@/lib/auth/session";

export interface AuthFormState {
  error?: string;
}

// persistCookies turns the backend's raw Set-Cookie headers into actual browser cookies on THIS
// Next.js app's own origin — see cookie-utils.ts's doc comment for why this can't just forward the
// raw header the way a Route Handler could.
async function persistCookies(setCookies: string[]): Promise<void> {
  const store = await cookies();
  for (const raw of setCookies) {
    const { name, value, ...options } = parseSetCookie(raw);
    store.set(name, value, options);
  }
}

// registerAction/loginAction both take (prevState, formData) — the exact shape React's
// useActionState hook expects, so the Client Component form (RegisterForm.tsx/LoginForm.tsx) can
// show a validation/credential error inline without a full page reload, while the actual auth call
// still runs entirely server-side.
export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "");

  let setCookies: string[];
  try {
    const result = await register({ name, email, password, phone });
    setCookies = result.setCookies;
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // redirect() works by throwing a special Next.js-internal value — it must be called OUTSIDE any
  // try/catch, or that catch would swallow it and the redirect would silently never happen.
  await persistCookies(setCookies);
  redirect("/");
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let setCookies: string[];
  try {
    const result = await login({ email, password });
    setCookies = result.setCookies;
  } catch (err) {
    // FR-AUTH-8: err.message here is already the backend's one generic "invalid email or password"
    // string, identical whether the email was unknown or the password was wrong — nothing in this
    // Server Action adds, removes, or varies that message.
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  await persistCookies(setCookies);
  redirect("/");
}

// logoutAction takes no form fields — it's invoked by a plain <form action={logoutAction}> with a
// single submit button (see the storefront layout's nav), reading whatever session cookie already
// exists rather than anything the caller provides.
export async function logoutAction(): Promise<void> {
  const cookieHeader = await cookieHeaderFromRequest();
  const setCookies = await logout(cookieHeader);
  await persistCookies(setCookies);
  redirect("/login");
}
