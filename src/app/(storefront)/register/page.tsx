import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/auth/safe-next";
import { AuthShell } from "../_components/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute, and your guest cart comes with you."
      footer={
        <>
          Already have an account?{" "}
          <Link href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="font-bold">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
