import type { Metadata } from "next";
import "../globals.css";

// The admin console's OWN root layout — separate from (storefront)'s, see that file's comment
// for why. Every admin route (/admin, /admin/products, /admin/orders, ...) renders inside this
// shell once those features are built.

export const metadata: Metadata = {
  title: "BrightBuy Admin",
  description: "BrightBuy staff and management console.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Shared admin chrome (nav, role-aware menu) lands here once 02-auth's role model
            reaches the frontend and 07-admin-catalog needs somewhere to live. */}
        {children}
      </body>
    </html>
  );
}
