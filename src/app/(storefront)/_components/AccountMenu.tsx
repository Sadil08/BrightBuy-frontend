import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { UserProfile } from "@/lib/api-client/auth";
import { ClipboardIcon, SlidersIcon, UserIcon } from "@/components/icons";

// A <details> disclosure, not a JS dropdown: it opens and closes with no client code at all and is
// keyboard accessible out of the box.
export function AccountMenu({ user }: { user: UserProfile }) {
  const isStaff = user.role !== "CUSTOMER";
  const initial = (user.name || user.email || "?").trim()[0]!.toUpperCase();
  return (
    <details className="group relative">
      <summary className="btn btn-outline !gap-2 !py-1.5 !pl-1.5 !pr-3 marker:hidden [&::-webkit-details-marker]:hidden list-none">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm font-extrabold text-paper">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{user.name.split(" ")[0]}</span>
      </summary>
      <div className="card absolute right-0 z-50 mt-2 w-60 overflow-hidden p-1.5 shadow-lift">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-ink-faint">{user.email}</p>
          <span className="badge badge-neutral mt-2">{user.role.replace("_", " ")}</span>
        </div>
        <div className="my-1 h-px bg-line" />
        {user.role === "CUSTOMER" && (
          <Link href="/orders" className="btn btn-ghost w-full !justify-start">
            <ClipboardIcon /> My orders
          </Link>
        )}
        {isStaff && (
          <Link href="/admin" className="btn btn-ghost w-full !justify-start">
            <SlidersIcon /> Staff console
          </Link>
        )}
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost w-full !justify-start">
            <UserIcon /> Log out
          </button>
        </form>
      </div>
    </details>
  );
}
