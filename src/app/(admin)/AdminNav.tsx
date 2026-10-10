"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ICONS, type AdminIconKey } from "@/lib/admin/tools";

export interface NavItem {
  href: string;
  label: string;
  icon: AdminIconKey;
}

// A client component only because it needs usePathname() to mark the current page. On a phone it is a
// horizontally scrolling strip; on desktop it is a vertical list in the sidebar.
export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Console" className="flex min-w-0 gap-1 overflow-x-auto lg:w-full lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const Icon = ADMIN_ICONS[item.icon];
        const current = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`btn !justify-start whitespace-nowrap ${current ? "bg-action-soft !text-action" : "btn-ghost"}`}
          >
            <Icon /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
