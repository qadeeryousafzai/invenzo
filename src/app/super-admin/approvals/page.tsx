import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import { VerificationList } from "@/components/super-admin/verification-list";
import type { Prisma } from "@prisma/client";

const statusOptions = new Set(["PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED", "EXPIRED", "REJECTED", "DELETED"]);

export default async function SuperAdminApprovalsPage({ searchParams }: PageProps<"/super-admin/approvals">) {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
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

  const [count, businesses] = await Promise.all([
    prisma.business.count({ where }),
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Approvals</h1>
        <p className="mt-2 text-sm text-slate-500">Review and manage business account approvals.</p>
      </div>
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
    </main>
  );
}