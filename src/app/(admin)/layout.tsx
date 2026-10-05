import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { logoutAction } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth/session";

// The admin console's OWN root layout — separate from (storefront)'s, see that file's comment
// for why. Every admin route (/admin, /admin/users, /admin/roles, ...) renders inside this shell.

export const metadata: Metadata = {
  title: "BrightBuy Admin",
  description: "BrightBuy staff and management console.",
};

// requireAdmin() runs ONCE here, in the shared layout, rather than being repeated in every admin
// page — protecting the layout protects everything rendered inside it. This is the REAL
// authorization check (a verified backend call, via getSession() underneath); proxy.ts's
// cookie-presence redirect only ever catches the "no session at all" case cheaply before even
// getting this far.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center gap-6 p-4">
            <Link href="/admin" className="font-semibold">
              BrightBuy Admin
            </Link>
            <Link href="/admin/users" className="text-sm text-zinc-600 dark:text-zinc-400">
              Users
            </Link>
            <Link href="/admin/roles" className="text-sm text-zinc-600 dark:text-zinc-400">
              Roles &amp; Permissions
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-zinc-500">{admin.name}</span>
              <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400">
                Storefront
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-sm text-zinc-600 underline dark:text-zinc-400">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
