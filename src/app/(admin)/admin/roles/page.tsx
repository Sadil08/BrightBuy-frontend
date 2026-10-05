import { listRoles, listPermissions } from "@/lib/api-client/auth";
import { cookieHeaderFromRequest } from "@/lib/auth/session";
import { RolePermissionsMatrix } from "./RolePermissionsMatrix";

export default async function RolesPage() {
  const cookieHeader = await cookieHeaderFromRequest();
  const [roles, permissions] = await Promise.all([listRoles(cookieHeader), listPermissions(cookieHeader)]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Roles &amp; Permissions</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Each role&apos;s checked boxes are its CURRENT grants (FR-AUTH-10) — saving replaces the
        whole set, it doesn&apos;t add to it.
      </p>
      <RolePermissionsMatrix roles={roles} permissions={permissions} />
    </main>
  );
}
