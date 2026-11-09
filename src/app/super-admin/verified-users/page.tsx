import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { UserManagementList } from "@/components/super-admin/user-management-list";

export default async function SuperAdminVerifiedUsersPage() {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, platformRole: true, disabledAt: true, deletedAt: true, createdAt: true, _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Verified Users</h1>
        <p className="mt-2 text-sm text-slate-500">List of verified users on the platform.</p>
      </div>
      <UserManagementList
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          disabledAt: user.disabledAt?.toISOString() ?? null,
          deletedAt: user.deletedAt?.toISOString() ?? null,
        }))}
        currentUserId={admin.id}
      />
    </main>
  );
}