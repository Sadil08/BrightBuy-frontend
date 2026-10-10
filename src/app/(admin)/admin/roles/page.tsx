import type { Metadata } from "next";
import { listRoles, listPermissions } from "@/lib/api-client/auth";
import { cookieHeaderFromRequest, requireAdmin } from "@/lib/auth/session";
import { RolePermissionsMatrix } from "./RolePermissionsMatrix";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  await requireAdmin();
  const cookieHeader = await cookieHeaderFromRequest();
  const [roles, permissions] = await Promise.all([listRoles(cookieHeader), listPermissions(cookieHeader)]);

  return (
    <main className="p-4 sm:p-10">
      <p className="eyebrow">Access control</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Roles &amp; permissions</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Each role&apos;s checked boxes are its current grants (FR-AUTH-10). Saving replaces the whole set, it
        doesn&apos;t add to it.
      </p>
      <div className="max-w-4xl">
        <RolePermissionsMatrix roles={roles} permissions={permissions} />
      </div>
    </main>
  );
}
