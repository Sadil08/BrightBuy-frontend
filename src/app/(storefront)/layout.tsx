import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "../globals.css";
import { getSession } from "@/lib/auth/session";
import { fontVariables } from "@/lib/fonts";
import { Logo } from "@/components/Logo";
import { SearchIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { AccountMenu } from "./_components/AccountMenu";
import { CartMergeSync } from "./_components/CartMergeSync";
import { CartNavLink } from "./_components/CartNavLink";

// This is a ROOT layout (it defines <html>/<body>) even though it's nested inside a route group.
// (storefront) and (admin) are two separate root layouts — Next.js route groups
// (folders in parens) don't add a URL segment, they just let you split the route tree into
// independently-rooted sections. Crossing between them is a full page reload, not a soft
// client-side navigation — acceptable here since a customer and a staff member browsing the
// admin console are never the same session doing both at once in practice.
// See specs/global/01_TECH_STACK.md §2 for why the split exists.

export const metadata: Metadata = {
  title: { default: "BrightBuy — electronics and toys", template: "%s · BrightBuy" },
  description: "Electronics and toys, online. Pick up in store the same day or get it delivered across Texas.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1020" },
  ],
};

// Async because it calls getSession() directly — a layout, like a page, can be an async Server
// Component. getSession() is cache()-wrapped (session.ts), so if a page inside this layout ALSO
// calls it, that's one shared backend call per request, not two.
export default async function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  const isCustomer = user?.role === "CUSTOMER";

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>

        {/* Fixed dark in both themes on purpose: it reads as a distinct strip above the page. */}
        <div className="bg-[#11162b] text-[0.82rem] text-white/85">
          <div className="container-page flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-center">
            <span className="inline-flex items-center gap-2">
              <StoreIcon /> Store pickup is ready the same day when it&apos;s in stock
            </span>
            <span className="inline-flex items-center gap-2">
              <TruckIcon /> Standard delivery across Texas in 5–7 days
            </span>
          </div>
        </div>

        <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
          <div className="container-page flex items-center gap-3 py-3 sm:gap-5">
            <Logo />

            {/* A plain GET form: works with JavaScript off, and lands on the same URL the category
                chips and pagination use. */}
            <form action="/products" method="GET" role="search" className="relative hidden flex-1 md:block md:max-w-xl">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="site-search"
                type="search"
                name="q"
                placeholder="Search laptops, headphones, building sets…"
                className="input !rounded-full !py-2.5 !pl-11"
              />
            </form>

            <nav aria-label="Main" className="ml-auto flex items-center gap-2">
              <Link href="/products" className="btn btn-ghost hidden sm:inline-flex">
                Shop
              </Link>
              <Link href="/products" aria-label="Search products" className="btn btn-ghost !px-3 md:hidden">
                <SearchIcon />
              </Link>
              {user ? (
                <AccountMenu user={user} />
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost">
                    Log in
                  </Link>
                  <Link href="/register" className="btn btn-primary hidden sm:inline-flex">
                    Sign up
                  </Link>
                </>
              )}
              <CartNavLink isCustomer={isCustomer} />
            </nav>
          </div>
        </header>

        <CartMergeSync isCustomer={isCustomer} />

        <div id="main" className="flex-1">
          {children}
        </div>

        <footer className="mt-20 border-t border-line bg-surface">
          <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo compact />
              <p className="mt-4 max-w-sm text-sm text-ink-soft">
                Electronics and toys for people who like things that work and things that delight. Serving
                customers across Texas, online and in store.
              </p>
            </div>
            <div>
              <p className="eyebrow">Shop</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li><Link href="/products" className="text-ink-soft no-underline hover:text-ink">All products</Link></li>
                <li><Link href="/cart" className="text-ink-soft no-underline hover:text-ink">Your cart</Link></li>
                <li><Link href="/orders" className="text-ink-soft no-underline hover:text-ink">Track an order</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Delivery</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                <li>Store pickup: same day if in stock</li>
                <li>Main cities: 5 days</li>
                <li>Other Texas cities: 7 days</li>
                <li>Out-of-stock items add 3 days</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="container-page flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-ink-faint">
              <span>© {new Date().getFullYear()} BrightBuy. Prices in US dollars.</span>
              <span>Payments are in test mode during Phase 1.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
