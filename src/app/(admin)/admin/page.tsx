import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { BoxIcon, ChevronRightIcon, KeyIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Overview" };

const TOOLS = [
  { href: "/admin/inventory", title: "Inventory", body: "Look up a variant by SKU or name, see its exact stock, and record restocks and corrections.", icon: BoxIcon, roles: ["WAREHOUSE_STAFF", "ADMIN"] },
  { href: "/admin/users", title: "Users", body: "See every account and create staff, manager and admin logins.", icon: UsersIcon, roles: ["ADMIN"] },
  { href: "/admin/roles", title: "Roles & permissions", body: "Choose exactly what each role is allowed to do.", icon: KeyIcon, roles: ["ADMIN"] },
];

export default async function AdminHome() {
  const user = await requireStaff();
  const mine = TOOLS.filter((tool) => tool.roles.includes(user.role));

  return (
    <main className="p-6 sm:p-10">
      <p className="eyebrow">Staff console</p>
      <h1 className="mt-2 text-4xl font-extrabold">Hello, {user.name.split(" ")[0]}.</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        {mine.length > 0 ? "Here is what your role can do." : "Your role doesn't have any console tools yet."}
      </p>

      {mine.length === 0 ? (
        <div className="card-flat mt-8 max-w-xl p-6 text-sm text-ink-soft">
          Order status updates and reports are being built next. Ask an administrator if you need another
          permission on your role.
        </div>
      ) : (
        <ul className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {mine.map((tool) => (
            <li key={tool.href}>
              <Link href={tool.href} className="card group flex h-full flex-col gap-3 p-6 no-underline transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-action-soft text-action"><tool.icon className="h-6 w-6" /></span>
                <h2 className="text-xl font-extrabold text-ink">{tool.title}</h2>
                <p className="text-sm text-ink-soft">{tool.body}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-action">Open <ChevronRightIcon className="transition group-hover:translate-x-1" /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
