import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/modules/businesses/permissions";
import { selectAuthorizedMembership } from "@/modules/businesses/tenant";

export class TenantAuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "TenantAuthorizationError";
  }
}

export async function getTenantContext() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const jar = await cookies();
  const requestedBusinessId = jar.get("active-business-id")?.value;
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, status: "ACTIVE", business: { deletedAt: null } },
    include: { business: true, role: { include: { permissions: { select: { permissionKey: true } } } } },
    orderBy: { joinedAt: "asc" },
  });
  const membership = selectAuthorizedMembership(memberships, requestedBusinessId);
  if (!membership) return { userId: session.user.id, platformRole: session.user.platformRole, memberships, membership: null };
  return {
    userId: session.user.id,
    platformRole: session.user.platformRole,
    memberships,
    membership,
    businessId: membership.businessId,
    permissions: new Set(membership.role.permissions.map((item) => item.permissionKey)),
  };
}

export async function requireTenantContext(permission?: PermissionKey) {
  const context = await getTenantContext();
  if (!context) throw new TenantAuthorizationError("Authentication required.");
  if (!context.membership || !context.businessId || !context.permissions) throw new TenantAuthorizationError("An active business membership is required.");
  if (permission && !context.permissions.has(permission)) throw new TenantAuthorizationError();
  return context as NonNullable<typeof context> & { businessId: string; membership: NonNullable<typeof context.membership>; permissions: Set<string> };
}

export async function requirePageTenant() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.membership) redirect("/register");
  return context;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new TenantAuthorizationError("Authentication required.");
  if (session.user.platformRole !== "SUPER_ADMIN") throw new TenantAuthorizationError("Platform administrator access required.");
  return session.user;
}
