import type { Metadata } from "next";
import { listUsers, listRoles } from "@/lib/api-client/auth";
import { cookieHeaderFromRequest, requireAdmin } from "@/lib/auth/session";
import { CreateStaffForm } from "./CreateStaffForm";

export const metadata: Metadata = { title: "Users" };

// The layout only requires "some staff member"; this page narrows it to ADMIN (the backend's
// account:manage_users permission is the real gate). It also needs the raw cookie header to make its
// OWN authenticated backend calls — getSession() verifies the session but doesn't hand the header back.
export default async function UsersPage() {
  await requireAdmin();
  const cookieHeader = await cookieHeaderFromRequest();
  const [userList, roles] = await Promise.all([listUsers(cookieHeader), listRoles(cookieHeader)]);

  return (
    <main className="p-6 sm:p-10">
      <p className="eyebrow">Accounts</p>
      <h1 className="mt-2 text-4xl font-extrabold">Users</h1>

      <div className="mt-8 grid max-w-6xl items-start gap-6 xl:grid-cols-[22rem_1fr]">
        <CreateStaffForm roles={roles} />

        <section className="card overflow-hidden" aria-label="All accounts">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {userList.items.map((user) => (
                  <tr key={user.userId}>
                    <td className="font-semibold">{user.name}</td>
                    <td className="text-ink-soft">{user.email}</td>
                    <td><span className="badge badge-neutral">{user.role.replace("_", " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-4 py-3 text-sm text-ink-faint">
            {userList.page.total} account{userList.page.total === 1 ? "" : "s"} total.
          </p>
        </section>
      </div>
    </main>
  );
}
