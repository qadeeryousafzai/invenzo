import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Building2, CircleCheck, Clock3, ShieldAlert, Ban, CalendarClock, XCircle, Archive, TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle } from "lucide-react";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { VerificationList } from "@/components/super-admin/verification-list";
import { UserManagementList } from "@/components/super-admin/user-management-list";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusOptions = new Set(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED", "EXPIRED", "REJECTED", "DELETED"]);

function StatCard({ label, value, note, icon: Icon, color }: { label: string; value: number | string; note: string; icon: React.ElementType; color: "primary" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const colorMap = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
    muted: "bg-surface-hover text-muted",
  };
  return (
    <Card className="clay-stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${colorMap[color]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="clay-chart-container">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DataListCard({ title, icon: Icon, iconColor, count, children, emptyMessage }: { 
  title: string; 
  icon: React.ElementType; 
  iconColor: string; 
  count: number; 
  children: React.ReactNode; 
  emptyMessage: string; 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={iconColor} size={20} />
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <Badge variant="neutral" className="text-xs">{count}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data, max, height = 160 }: { data: { label: string; value: number }[]; max: number; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Bar chart">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map(({ label, value }) => {
          const barHeight = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={label} className="flex-1 flex flex-col items-center justify-end min-w-0" title={`${label}: ${value}`}>
              <div className="w-full bg-primary rounded-t transition-all duration-500" style={{ height: `${barHeight}%` }} />
              <span className="mt-2 text-[10px] font-medium text-muted-foreground text-center truncate w-full">{label}</span>
              <span className="text-xs font-semibold text-foreground">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AreaChart({ data, max, height = 160 }: { data: { label: string; value: number }[]; max: number; height?: number }) {
  const points = data.map(({ value }, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = max > 0 ? 100 - (value / max) * 100 : 50;
    return `${x}% ${y}%`;
  }).join(", ");
  const areaPoints = [`0% 100%`, ...points.split(", ").map(p => p.trim()), `100% 100%`].join(", ");

  return (
    <div className="relative" style={{ height }}>
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative h-full flex items-end justify-between gap-1 px-2">
        {data.map(({ label, value }, i) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end min-w-0" title={`${label}: ${value}`}>
            <div className="w-2 h-2 rounded-full bg-primary" style={{ bottom: max > 0 ? `${(value / max) * 100}%` : "0%" }} />
            <span className="mt-2 text-[10px] font-medium text-muted-foreground text-center truncate w-full">{label}</span>
            <span className="text-xs font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
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

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const [total, activeCount, pendingCount, suspendedCount, blockedCount, expiredCount, rejectedCount, deletedCount, count, settings, users, monthlyRegistrations, expiryData] = await Promise.all([
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
    prisma.business.groupBy({
      by: ["createdAt"],
      _count: true,
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.business.findMany({
      where: { deletedAt: null, subscriptionExpiresAt: { lte: inThirtyDays } },
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

  const expiredBusinesses = expiryData.filter(b => b.subscriptionExpiresAt && new Date(b.subscriptionExpiresAt) <= now);
  const nearExpiryBusinesses = expiryData.filter(b => b.subscriptionExpiresAt && new Date(b.subscriptionExpiresAt) > now);

  const statusData = [
    { label: "Active", value: activeCount },
    { label: "Pending", value: pendingCount },
    { label: "Suspended", value: suspendedCount },
    { label: "Blocked", value: blockedCount },
    { label: "Expired", value: expiredCount },
    { label: "Rejected", value: rejectedCount },
  ];
  const maxStatus = Math.max(...statusData.map(d => d.value), 1);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7);
    const count = monthlyRegistrations.filter(r => r.createdAt.toISOString().slice(0, 7) === monthKey).reduce((sum, r) => sum + r._count, 0);
    return { label: date.toLocaleDateString("en", { month: "short" }), value: count };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.value), 1);

  return (
    <main className="flex-1 min-w-0 mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.15em] text-primary">PLATFORM OPERATIONS</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Super admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review applications and control each business account from one place.</p>
        </div>
        <Link href="/super-admin/settings">
          <Button variant="secondary" size="sm">Account settings · {settings.defaultAccessMonths} month{settings.defaultAccessMonths === 1 ? "" : "s"} default</Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total businesses" value={total} note="All submitted workspaces" icon={Building2} color="primary" />
        <StatCard label="Active" value={activeCount} note="Currently within access period" icon={CircleCheck} color="success" />
        <StatCard label="Pending approval" value={pendingCount} note="Awaiting platform review" icon={Clock3} color="warning" />
        <StatCard label="Suspended" value={suspendedCount} note="Access restricted by admin" icon={ShieldAlert} color="muted" />
        <StatCard label="Temporarily blocked" value={blockedCount} note="Temporary login restriction" icon={Ban} color="warning" />
        <StatCard label="Expired" value={expiredCount} note="Access period has ended" icon={CalendarClock} color="danger" />
        <StatCard label="Rejected" value={rejectedCount} note="Applications not approved" icon={XCircle} color="danger" />
        <StatCard label="Deleted" value={deletedCount} note="Soft deleted; data retained" icon={Archive} color="muted" />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Business Status Distribution">
          <BarChart data={statusData} max={maxStatus} />
        </ChartCard>
        <ChartCard title="Monthly Registrations (Last 6 Months)">
          <AreaChart data={monthlyData} max={maxMonthly} />
        </ChartCard>
      </section>

      {/* Expiry Alerts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <DataListCard
          title="Expired Subscriptions"
          icon={CalendarClock}
          iconColor="text-danger"
          count={expiredBusinesses.length}
          emptyMessage="No expired subscriptions"
        >
          {expiredBusinesses.map((business) => (
            <div key={business.id} className="flex items-center justify-between p-3 rounded-lg bg-danger-light/50 border border-danger/10">
              <div>
                <p className="font-medium text-foreground">{business.name}</p>
                <p className="text-xs text-muted-foreground">Expired {business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt).toLocaleDateString() : "recently"}</p>
              </div>
              <Badge variant="danger" className="text-xs">{business.accountStatus}</Badge>
            </div>
          ))}
        </DataListCard>

        <DataListCard
          title="Near Expiry (within 30 days)"
          icon={Clock3}
          iconColor="text-warning"
          count={nearExpiryBusinesses.length}
          emptyMessage="No subscriptions near expiry"
        >
          {nearExpiryBusinesses.map((business) => {
            const daysLeft = business.subscriptionExpiresAt ? Math.ceil((new Date(business.subscriptionExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            return (
              <div key={business.id} className="flex items-center justify-between p-3 rounded-lg bg-warning-light/50 border border-warning/10">
                <div>
                  <p className="font-medium text-foreground">{business.name}</p>
                  <p className="text-xs text-muted-foreground">Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} ({business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt).toLocaleDateString() : "soon"})</p>
                </div>
                <Badge variant="warning" className="text-xs">{daysLeft}d left</Badge>
              </div>
            );
          })}
        </DataListCard>
      </section>

      {/* Business Management Table */}
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
      
      {/* User Management */}
      <UserManagementList
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          disabledAt: user.disabledAt?.toISOString() ?? null,
          deletedAt: user.deletedAt?.toISOString() ?? null,
        }))}
        currentUserId={admin.id}
      />
      
      <p className="text-xs text-muted-foreground text-center py-4">
        New approvals start their configured access period on the activation date. Expiry never removes workspace data.
      </p>
    </main>
  );
}