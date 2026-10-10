import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { ADMIN_ICONS, toolsForRole } from "@/lib/admin/tools";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHome() {
  const user = await requireStaff();
  const mine = toolsForRole(user.role);

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Staff console</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Hello, {user.name.split(" ")[0]}.</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        {mine.length > 0 ? "Here is what your role can do." : "Your role doesn't have any console tools yet."}
      </p>

      {mine.length === 0 ? (
        <div className="card-flat mt-8 max-w-xl p-6 text-sm text-ink-soft">
          Ask an administrator if you need another permission on your role.
        </div>
      ) : (
        <ul className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {mine.map((tool) => {
            const Icon = ADMIN_ICONS[tool.icon];
            return (
              <li key={tool.href}>
                <Link href={tool.href} className="card group flex h-full flex-col gap-3 p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-action-soft text-action"><Icon className="h-6 w-6" /></span>
                  <h2 className="text-xl font-extrabold text-ink">{tool.label}</h2>
                  <p className="text-sm text-ink-soft">{tool.body}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-action">Open <ChevronRightIcon className="transition group-hover:translate-x-1" /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
