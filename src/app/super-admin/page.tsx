import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Building2, CircleCheck, Clock3, ShieldAlert, Ban, CalendarClock, XCircle, Archive } from "lucide-react";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { VerificationList } from "@/components/super-admin/verification-list";
import { UserManagementList } from "@/components/super-admin/user-management-list";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import type { Prisma } from "@prisma/client";

const statusOptions = new Set(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED", "EXPIRED", "REJECTED", "DELETED"]);

export default async function SuperAdminPage({ searchParams }: PageProps<"/super-admin">) {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedStatus = typeof params.status === "string" && statusOptions.has(params.status) ? params.status : "";
  const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = 20;
  const now = new Date();

  const clauses: Prisma.BusinessWhereInput[] = [];
  if (query) clauses.push({ OR: [
    { name: { contains: query } },
    { email: { contains: query } },
    { phone: { contains: query } },
    { memberships: { some: { role: { key: "OWNER" }, user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } } },
  ] });
  if (requestedStatus === "ACTIVE") clauses.push({ deletedAt: null, subscriptionExpiresAt: { gt: now }, OR: [{ accountStatus: "ACTIVE" }, { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now } }] });
  else if (requestedStatus === "EXPIRED") clauses.push({ deletedAt: null, OR: [
    { accountStatus: "EXPIRED" },
    { accountStatus: "ACTIVE", subscriptionExpiresAt: { lte: now } },
    { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now }, subscriptionExpiresAt: { lte: now } },
  ] });
  else if (requestedStatus === "DELETED") clauses.push({ OR: [{ accountStatus: "DELETED" }, { deletedAt: { not: null } }] });
  else if (requestedStatus) clauses.push({ accountStatus: requestedStatus as "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "TEMPORARILY_BLOCKED" | "EXPIRED" | "REJECTED" | "DELETED" });
  const where: Prisma.BusinessWhereInput = clauses.length ? { AND: clauses } : {};

  const [total, activeCount, pendingCount, suspendedCount, blockedCount, expiredCount, rejectedCount, deletedCount, count, settings] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { deletedAt: null, subscriptionExpiresAt: { gt: now }, OR: [{ accountStatus: "ACTIVE" }, { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now } }] } }),
    prisma.business.count({ where: { deletedAt: null, accountStatus: "PENDING_APPROVAL" } }),
    prisma.business.count({ where: { deletedAt: null, accountStatus: "SUSPENDED" } }),
    prisma.business.count({ where: { deletedAt: null, accountStatus: "TEMPORARILY_BLOCKED", OR: [{ statusUntil: null }, { statusUntil: { gt: now } }] } }),
    prisma.business.count({ where: { deletedAt: null, OR: [{ accountStatus: "EXPIRED" }, { accountStatus: "ACTIVE", subscriptionExpiresAt: { lte: now } }, { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now }, subscriptionExpiresAt: { lte: now } }] } }),
    prisma.business.count({ where: { deletedAt: null, accountStatus: "REJECTED" } }),
    prisma.business.count({ where: { OR: [{ accountStatus: "DELETED" }, { deletedAt: { not: null } }] } }),
    prisma.business.count({ where }),
    prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);
  const [businesses, users, unreadNotifications] = await Promise.all([
    prisma.business.findMany({
      where,
      select: {
        id: true, name: true, type: true, email: true, createdAt: true, accountStatus: true,
        subscriptionStartedAt: true, subscriptionExpiresAt: true, statusUntil: true,
        statusReason: true, rejectionReason: true, deletedAt: true,
        approvedBy: { select: { name: true } },
        memberships: { where: { role: { key: "OWNER" } }, take: 1, select: { user: { select: { name: true, email: true } } } },
        _count: { select: { memberships: true, branches: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true, platformRole: true, disabledAt: true, deletedAt: true, createdAt: true, _count: { select: { memberships: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { audience: "PLATFORM_ADMIN", OR: [{ userId: admin.id }, { userId: null }], readAt: null } }),
  ]);
  const stats = [
    { label: "Total businesses", value: total, note: "All submitted workspaces", icon: Building2, tint: "bg-blue-50 text-blue-700" },
    { label: "Active", value: activeCount, note: "Currently within their access period", icon: CircleCheck, tint: "bg-emerald-50 text-emerald-700" },
    { label: "Pending approval", value: pendingCount, note: "Awaiting platform review", icon: Clock3, tint: "bg-amber-50 text-amber-700" },
    { label: "Suspended", value: suspendedCount, note: "Access restricted by an admin", icon: ShieldAlert, tint: "bg-slate-100 text-slate-700" },
    { label: "Temporarily blocked", value: blockedCount, note: "Temporary login restriction", icon: Ban, tint: "bg-orange-50 text-orange-700" },
    { label: "Expired", value: expiredCount, note: "Access period has ended", icon: CalendarClock, tint: "bg-orange-50 text-orange-700" },
    { label: "Rejected", value: rejectedCount, note: "Applications not approved", icon: XCircle, tint: "bg-red-50 text-red-700" },
    { label: "Deleted", value: deletedCount, note: "Soft deleted; data retained", icon: Archive, tint: "bg-slate-100 text-slate-600" },
  ];

  return <div className="min-h-screen bg-[#f7f8f6]">
    <AdminHeader name={admin.name ?? admin.email ?? "Administrator"} unreadNotifications={unreadNotifications} />
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Super admin</h1><p className="mt-2 text-sm text-slate-500">Review applications and control each business account from one place.</p></div><Link href="/super-admin/settings" className="button-secondary">Account settings · {settings.defaultAccessMonths} month{settings.defaultAccessMonths === 1 ? "" : "s"} default</Link></div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, note, icon: Icon, tint }) => <article key={label} className="surface-card p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><span className={`grid size-8 place-items-center rounded-lg ${tint}`}><Icon size={16} /></span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p></article>)}</section>
      <VerificationList
        businesses={businesses.map((business) => ({
          id: business.id,
          name: business.name,
          type: business.type,
          email: business.email,
          ownerName: business.memberships[0]?.user.name ?? null,
          ownerEmail: business.memberships[0]?.user.email ?? null,
          createdAt: business.createdAt.toISOString(),
          accountStatus: getWorkspaceAccessStatus(business, now),
          subscriptionStartedAt: business.subscriptionStartedAt?.toISOString() ?? null,
          subscriptionExpiresAt: business.subscriptionExpiresAt?.toISOString() ?? null,
          statusUntil: business.statusUntil?.toISOString() ?? null,
          rejectionReason: business.rejectionReason,
          statusReason: business.statusReason,
          approvedByName: business.approvedBy?.name ?? null,
          deletedAt: business.deletedAt?.toISOString() ?? null,
          _count: business._count,
        }))}
        filters={{ query, status: requestedStatus }}
        pagination={{ page: currentPage, totalPages, total: count }}
      />
      <UserManagementList users={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString(), disabledAt: user.disabledAt?.toISOString() ?? null, deletedAt: user.deletedAt?.toISOString() ?? null }))} currentUserId={admin.id} />
      <p className="text-xs text-slate-500">New approvals start their configured access period on the activation date. Expiry never removes workspace data.</p>
    </main>
  </div>;
}
