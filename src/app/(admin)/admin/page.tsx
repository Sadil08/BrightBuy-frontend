import Link from "next/link";

// requireAdmin() already ran in the shared (admin)/layout.tsx — nothing further to check here.
export default function AdminHome() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">BrightBuy Admin</h1>
      <p className="mt-2 text-zinc-500">
        02-auth&apos;s account and RBAC management. Catalog/order management lands with 07-admin-catalog.
      </p>
      <div className="mt-6 flex gap-4">
        <Link href="/admin/users" className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Manage users
        </Link>
        <Link href="/admin/roles" className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Manage roles &amp; permissions
        </Link>
      </div>
    </main>
  );
}
