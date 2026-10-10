import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "../globals.css";
import { logoutAction } from "@/app/actions/auth";
import { requireStaff } from "@/lib/auth/session";
import { fontVariables } from "@/lib/fonts";
import { Logo } from "@/components/Logo";
import { toolsForRole } from "@/lib/admin/tools";
import { AdminNav, type NavItem } from "./AdminNav";

// The admin console's OWN root layout — separate from (storefront)'s, see that file's comment
// for why. Every console route (/admin, /admin/inventory, /admin/users, ...) renders inside this shell.

export const metadata: Metadata = {
  title: { default: "BrightBuy Staff", template: "%s · BrightBuy Staff" },
  description: "BrightBuy staff and management console.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1020" },
  ],
};

// requireStaff() runs ONCE here, in the shared layout, so every console page is behind a verified
// session and a non-customer account. It is the real check for "is this a staff member"; proxy.ts's
// cookie-presence redirect only ever catches "no session at all" cheaply. What each ROLE may do is
// narrowed again by the pages themselves and enforced finally by the backend.
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireStaff();

  // Which tools this role is offered. Presentation, not access control: hiding a link never
  // protects anything (02_SECURITY_BASELINE.md §1), the backend's permission checks do.
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "home" },
    ...toolsForRole(user.role).map(({ href, label, icon }) => ({ href, label, icon })),
  ];

  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
        <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3 sm:p-4 lg:flex-col lg:h-full lg:items-start lg:gap-5 lg:p-5">
            <div className="flex flex-col gap-1">
              <Logo href="/admin" compact />
              <span className="eyebrow">Staff console</span>
            </div>
            {/* Phones: sign-out and a way back to the shop live in the top row (the sidebar footer below is desktop-only). */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/" className="btn btn-outline btn-sm">Shop</Link>
              <form action={logoutAction}><button type="submit" className="btn btn-ghost btn-sm">Log out</button></form>
            </div>
            <div className="order-last w-full min-w-0 lg:order-none">
              <AdminNav items={items} />
            </div>
            <div className="hidden w-full flex-col gap-3 border-t border-line pt-4 lg:mt-auto lg:flex">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <span className="badge badge-neutral mt-1">{user.role.replace("_", " ")}</span>
              </div>
              <div className="flex gap-2">
                <Link href="/" className="btn btn-outline btn-sm flex-1">Storefront</Link>
                <form action={logoutAction}><button type="submit" className="btn btn-ghost btn-sm">Log out</button></form>
              </div>
            </div>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </body>
    </html>
  );
}
