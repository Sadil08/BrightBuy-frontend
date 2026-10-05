import { listUsers, listRoles } from "@/lib/api-client/auth";
import { cookieHeaderFromRequest } from "@/lib/auth/session";
import { CreateStaffForm } from "./CreateStaffForm";

// requireAdmin() already ran in (admin)/layout.tsx. This page just needs the raw cookie header to
// make its OWN two authenticated backend calls (listUsers, listRoles) — getSession() already
// verified the session is valid, but it doesn't hand back the cookie header itself, so each page
// needing further authenticated data still forwards its own.
export default async function UsersPage() {
  const cookieHeader = await cookieHeaderFromRequest();
  const [userList, roles] = await Promise.all([listUsers(cookieHeader), listRoles(cookieHeader)]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Users</h1>

      <div className="mt-6">
        <CreateStaffForm roles={roles} />
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
          </tr>
        </thead>
        <tbody>
          {userList.items.map((user) => (
            <tr key={user.userId} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">{user.name}</td>
              <td className="py-2 pr-4">{user.email}</td>
              <td className="py-2 pr-4">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-zinc-500">
        {userList.page.total} account{userList.page.total === 1 ? "" : "s"} total.
      </p>
    </main>
  );
}
