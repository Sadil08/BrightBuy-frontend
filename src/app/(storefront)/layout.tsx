import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth/session";

// This is a ROOT layout (it defines <html>/<body>) even though it's nested inside a route group.
// (storefront) and (admin) are two separate root layouts — Next.js route groups
// (folders in parens) don't add a URL segment, they just let you split the route tree into
// independently-rooted sections. Crossing between them is a full page reload, not a soft
// client-side navigation — acceptable here since a customer and a staff member browsing the
// admin console are never the same session doing both at once in practice.
// See specs/global/01_TECH_STACK.md §2 for why the split exists.

export const metadata: Metadata = {
  title: "BrightBuy",
  description: "BrightBuy — electronics and toys, online.",
};

// Async because it calls getSession() directly — a layout, like a page, can be an async Server
// Component. getSession() is cache()-wrapped (session.ts), so if a page inside this layout ALSO
// calls it (e.g. the admin pages' requireAdmin()), that's one shared backend call per request, not two.
export default async function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html lang="en">
      <body>
        {/* 01-catalog's minimal version of this comment's long-standing placeholder: just enough
            chrome to get from any page to the catalog. Cart icon/badge lands with 03-cart; a real
            footer isn't anything any feature's spec actually asks for yet. */}
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center gap-6 p-4">
            <Link href="/" className="font-semibold">
              BrightBuy
            </Link>
            <Link href="/products" className="text-sm text-zinc-600 dark:text-zinc-400">
              Products
            </Link>

            {/* ml-auto pushes the auth controls to the far right without needing a second nav or a
                flex-wrapper change — the two links above stay left-aligned exactly as before. */}
            <div className="ml-auto flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-zinc-500">
                    {user.name} ({user.role})
                  </span>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="text-sm text-zinc-600 dark:text-zinc-400">
                      Admin
                    </Link>
                  )}
                  {/* A single-button form calling a Server Action directly — no client JS needed,
                      same progressive-enhancement reasoning as every other form in this codebase. */}
                  <form action={logoutAction}>
                    <button type="submit" className="text-sm text-zinc-600 underline dark:text-zinc-400">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400">
                    Log in
                  </Link>
                  <Link href="/register" className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
