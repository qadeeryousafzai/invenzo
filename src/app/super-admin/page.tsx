import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Building2, CircleCheck, Clock3, ShieldAlert, Ban, CalendarClock, XCircle, Archive, TrendingUp, TrendingDown } from "lucide-react";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { VerificationList } from "@/components/super-admin/verification-list";
import { UserManagementList } from "@/components/super-admin/user-management-list";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import type { Prisma } from "@prisma/client";

const statusOptions = new Set(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED", "EXPIRED", "REJECTED", "DELETED"]);

function BarChart({ data, max, height = 120, color = "bg-emerald-500", labelColor = "text-slate-500" }: { data: { label: string; value: number }[]; max: number; height?: number; color?: string; labelColor?: string }) {
  return (
    <div className="surface-card p-4" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2" role="img" aria-label="Bar chart">
        {data.map(({ label, value }) => {
          const barHeight = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={label} className="flex-1 flex flex-col items-center justify-end min-w-0" title={`${label}: ${value}`}>
              <div className={`w-full ${color} rounded-t transition-all duration-500`} style={{ height: `${barHeight}%` }} />
              <span className={`mt-2 text-[10px] font-medium ${labelColor} text-center truncate w-full`}>{label}</span>
              <span className="text-xs font-semibold text-slate-950">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AreaChart({ data, max, height = 120, color = "bg-emerald-500/30", lineColor = "bg-emerald-500" }: { data: { label: string; value: number }[]; max: number; height?: number; color?: string; lineColor?: string }) {
  const points = data.map(({ value }, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = max > 0 ? 100 - (value / max) * 100 : 50;
    return `${x}% ${y}%`;
  }).join(", ");
  const areaPoints = [
    `0% 100%`,
    ...points.split(", ").map(p => p.trim()),
    `100% 100%`,
  ].join(", ");

  return (
    <div className="surface-card p-4 relative" style={{ height }}>
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative h-full flex items-end justify-between gap-1 px-2">
        {data.map(({ label, value }, i) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end min-w-0" title={`${label}: ${value}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ bottom: max > 0 ? `${(value / max) * 100}%` : "0%" }} />
            <span className="mt-2 text-[10px] font-medium text-slate-500 text-center truncate w-full">{label}</span>
            <span className="text-xs font-semibold text-slate-950">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, tint, trend }: { label: string; value: number | string; change?: string; icon: React.ElementType; tint: string; trend?: "up" | "down" }) {
  return (
    <article className="surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${tint}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        {change && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
        )}
      </div>
    </article>
  );
}

export default async function SuperAdminPage({ searchParams }: PageProps<"/super-admin">) {
  await connection();
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch {
    redirect("/login");
  }
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedStatus = typeof params.status === "string" && statusOptions.has(params.status) ? params.status : "";
  const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = 20;
  const now = new Date();

  const clauses: Prisma.BusinessWhereInput[] = [];
  if (query) clauses.push({
    OR: [
      { name: { contains: query } },
      { email: { contains: query } },
      { phone: { contains: query } },
      { memberships: { some: { role: { key: "OWNER" }, user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } } } },
    ],
  });
  if (requestedStatus === "ACTIVE") clauses.push({ deletedAt: null, subscriptionExpiresAt: { gt: now }, OR: [{ accountStatus: "ACTIVE" }, { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now } }] });
  else if (requestedStatus === "EXPIRED") clauses.push({ deletedAt: null, OR: [
    { accountStatus: "EXPIRED" },
    { accountStatus: "ACTIVE", subscriptionExpiresAt: { lte: now } },
    { accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now }, subscriptionExpiresAt: { lte: now } },
  ] });
  else if (requestedStatus === "DELETED") clauses.push({ OR: [{ accountStatus: "DELETED" }, { deletedAt: { not: null } }] });
  else if (requestedStatus) clauses.push({ accountStatus: requestedStatus as "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "TEMPORARILY_BLOCKED" | "EXPIRED" | "REJECTED" | "DELETED" });
  const where: Prisma.BusinessWhereInput = clauses.length ? { AND: clauses } : {};

  const [total, activeCount, pendingCount, suspendedCount, blockedCount, expiredCount, rejectedCount, deletedCount, count, settings, users, statusBreakdown, monthlyRegistrations, expiryData] = await Promise.all([
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
    prisma.user.findMany({ select: { id: true, name: true, email: true, platformRole: true, disabledAt: true, deletedAt: true, createdAt: true, _count: { select: { memberships: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.business.groupBy({ by: ["accountStatus"], _count: true, where: { deletedAt: null } }),
    prisma.business.groupBy({
      by: ["createdAt"],
      _count: true,
      where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.business.findMany({
      where: { deletedAt: null, subscriptionExpiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      select: { id: true, name: true, subscriptionExpiresAt: true, accountStatus: true },
      orderBy: { subscriptionExpiresAt: "asc" },
      take: 10,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);

  const [businesses] = await Promise.all([
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

  const statusData = [
    { label: "Active", value: activeCount },
    { label: "Pending", value: pendingCount },
    { label: "Suspended", value: suspendedCount },
    { label: "Blocked", value: blockedCount },
    { label: "Expired", value: expiredCount },
    { label: "Rejected", value: rejectedCount },
  ];
  const maxStatus = Math.max(...statusData.map(d => d.value));

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7);
    const count = monthlyRegistrations.filter(r => r.createdAt.toISOString().slice(0, 7) === monthKey).reduce((sum, r) => sum + r._count, 0);
    return { label: date.toLocaleDateString("en", { month: "short" }), value: count };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.value));

  const expiredBusinesses = expiryData.filter(b => b.subscriptionExpiresAt && new Date(b.subscriptionExpiresAt) <= now);
  const nearExpiryBusinesses = expiryData.filter(b => b.subscriptionExpiresAt && new Date(b.subscriptionExpiresAt) > now);

  return (
    <main className="flex-1 min-w-0 mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Super admin</h1>
          <p className="mt-2 text-sm text-slate-500">Review applications and control each business account from one place.</p>
        </div>
        <Link href="/super-admin/settings" className="button-secondary">
          Account settings · {settings.defaultAccessMonths} month{settings.defaultAccessMonths === 1 ? "" : "s"} default
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, tint }) => (
          <article key={label} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <span className={`grid size-8 place-items-center rounded-lg ${tint}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-[10px] text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-4">
          <h2 className="text-sm font-semibold text-slate-950 mb-4">Business Status Distribution</h2>
          <BarChart data={statusData} max={maxStatus} height={160} color="bg-emerald-500" />
        </div>
        <div className="surface-card p-4">
          <h2 className="text-sm font-semibold text-slate-950 mb-4">Monthly Registrations (Last 6 Months)</h2>
          <AreaChart data={monthlyData} max={maxMonthly} height={160} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-950 flex items-center gap-2">
              <CalendarClock className="text-orange-500" size={20} />
              Expired Subscriptions
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">{expiredBusinesses.length}</span>
            </h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expiredBusinesses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No expired subscriptions</p>
            ) : (
              expiredBusinesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-slate-950">{business.name}</p>
                    <p className="text-xs text-slate-500">Expired {business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt).toLocaleDateString() : "recently"}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">{business.accountStatus}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-950 flex items-center gap-2">
              <Clock3 className="text-amber-500" size={20} />
              Near Expiry (within 30 days)
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{nearExpiryBusinesses.length}</span>
            </h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {nearExpiryBusinesses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No subscriptions near expiry</p>
            ) : (
              nearExpiryBusinesses.map((business) => {
                const daysLeft = business.subscriptionExpiresAt ? Math.ceil((new Date(business.subscriptionExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                return (
                  <div key={business.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="font-medium text-slate-950">{business.name}</p>
                      <p className="text-xs text-slate-500">Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} ({business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt).toLocaleDateString() : "soon"})</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">{daysLeft}d left</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

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
      <UserManagementList
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          disabledAt: user.disabledAt?.toISOString() ?? null,
          deletedAt: user.deletedAt?.toISOString() ?? null,
        }))}
        currentUserId={admin.id}
      />
      <p className="text-xs text-slate-500">
        New approvals start their configured access period on the activation date. Expiry never removes workspace data.
      </p>
    </main>
  );
}