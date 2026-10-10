// The ONE registry of staff-console tools. The sidebar (layout), the overview cards (admin/page) and
// the per-page role gate (lib/auth/session.requireToolAccess) all read from this list, so adding a
// feature to the console is: build its pages under /admin/<feature>, add one entry here. Nothing else
// changes (specs/global/06_ENGINEERING_STANDARDS — features are loosely coupled).
//
// `roles` is presentation + a coarse UX gate only. The backend's RequirePermission checks are the real
// enforcement (02_SECURITY_BASELINE.md §1): the profile carries a role name, not a permission list.
import {
  BoxIcon,
  ChartIcon,
  KeyIcon,
  ReceiptIcon,
  SlidersIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

export type StaffRole = "WAREHOUSE_STAFF" | "ORDER_MANAGER" | "MANAGER" | "ADMIN";

export type AdminIconKey = "home" | "box" | "tag" | "receipt" | "chart" | "users" | "key";

// Icon components are looked up by key because a Server Component (the layout) cannot pass a function
// prop to a Client Component (the nav) — only plain strings cross that boundary.
export const ADMIN_ICONS = {
  home: SlidersIcon,
  box: BoxIcon,
  tag: TagIcon,
  receipt: ReceiptIcon,
  chart: ChartIcon,
  users: UsersIcon,
  key: KeyIcon,
} as const;

export interface AdminTool {
  href: string;
  label: string;
  body: string;
  icon: AdminIconKey;
  roles: readonly StaffRole[];
}

export const ADMIN_TOOLS: readonly AdminTool[] = [
  { href: "/admin/catalog", label: "Catalogue", icon: "tag", roles: ["WAREHOUSE_STAFF", "ADMIN"], body: "Create and edit products, variants, categories and product images." },
  { href: "/admin/inventory", label: "Inventory", icon: "box", roles: ["WAREHOUSE_STAFF", "ADMIN"], body: "Look up a variant by SKU or name, see its exact stock, and record restocks and corrections." },
  { href: "/admin/orders", label: "Orders", icon: "receipt", roles: ["ORDER_MANAGER", "ADMIN"], body: "Work the order queue: move orders through fulfilment, cancel them, and see their history." },
  { href: "/admin/reports", label: "Reports", icon: "chart", roles: ["MANAGER", "ADMIN"], body: "Quarterly sales, top sellers, category demand, upcoming deliveries and customer payments, with CSV export." },
  { href: "/admin/users", label: "Users", icon: "users", roles: ["ADMIN"], body: "See every account and create staff, manager and admin logins." },
  { href: "/admin/roles", label: "Roles & permissions", icon: "key", roles: ["ADMIN"], body: "Choose exactly what each role is allowed to do." },
];

export function toolsForRole(role: string): AdminTool[] {
  return ADMIN_TOOLS.filter((tool) => (tool.roles as readonly string[]).includes(role));
}

export function toolRoles(href: string): readonly StaffRole[] {
  return ADMIN_TOOLS.find((tool) => tool.href === href)?.roles ?? [];
}
