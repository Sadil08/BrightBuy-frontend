import type { Metadata } from "next";
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
        {/* Shared storefront chrome (nav, cart icon, footer) lands here once 01-catalog builds it. */}
        {children}
      </body>
    </html>
  );
}
