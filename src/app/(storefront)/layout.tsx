import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

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

export default function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
