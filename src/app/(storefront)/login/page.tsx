import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/auth/safe-next";
import { AuthShell } from "../_components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your cart, your orders and check out."
      footer={
        <>
          New here?{" "}
          <Link href={next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`} className="font-bold">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
