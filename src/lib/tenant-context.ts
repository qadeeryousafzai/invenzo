import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/modules/businesses/permissions";
import { selectAuthorizedMembership } from "@/modules/businesses/tenant";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import { expandPermissions } from "@/modules/businesses/permission-map";
import { PERMISSIONS } from "@/modules/businesses/permissions";

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
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { business: true, role: { include: { permissions: { select: { permissionKey: true } } } } },
    orderBy: { joinedAt: "asc" },
  });
  const now = new Date();
  const activeMemberships = memberships.filter((item) => getWorkspaceAccessStatus(item.business, now) === "ACTIVE");
  const membership = selectAuthorizedMembership(activeMemberships, requestedBusinessId)
    ?? (activeMemberships.length === 0 ? selectAuthorizedMembership(memberships, requestedBusinessId) : undefined);
  const selectableMemberships = activeMemberships.length > 0 ? activeMemberships : memberships;
  if (!membership) return { userId: session.user.id, platformRole: session.user.platformRole, memberships, membership: null };
  const permissions = membership.role.key === "OWNER"
    ? new Set(Object.keys(PERMISSIONS))
    : expandPermissions(membership.role.permissions.map((item) => item.permissionKey));
  return {
    userId: session.user.id,
    platformRole: session.user.platformRole,
    memberships: selectableMemberships,
    membership,
    businessId: membership.businessId,
    permissions,
  };
}

export async function requireTenantContext(permission?: PermissionKey) {
  const context = await getTenantContext();
  if (!context) throw new TenantAuthorizationError("Authentication required.");
  if (!context.membership || !context.businessId || !context.permissions) throw new TenantAuthorizationError("An active business membership is required.");
  if (getWorkspaceAccessStatus(context.membership.business) !== "ACTIVE") throw new TenantAuthorizationError("Workspace access is not active. Contact the platform administrator to activate or renew it.");
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
  if (!session?.user?.id) {
    console.warn("[requireSuperAdmin] no session");
    throw new TenantAuthorizationError("Authentication required.");
  }
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, platformRole: true, disabledAt: true, deletedAt: true } });
  if (!currentUser) {
    console.warn("[requireSuperAdmin] user not found", { userId: session.user.id });
    throw new TenantAuthorizationError("Authentication required.");
  }
  if (currentUser.disabledAt || currentUser.deletedAt) {
    console.warn("[requireSuperAdmin] user disabled/deleted", { userId: currentUser.id, disabledAt: currentUser.disabledAt, deletedAt: currentUser.deletedAt });
    throw new TenantAuthorizationError("Authentication required.");
  }
  if (currentUser.platformRole !== "SUPER_ADMIN") {
    console.warn("[requireSuperAdmin] not super admin", { userId: currentUser.id, platformRole: currentUser.platformRole });
    throw new TenantAuthorizationError("Platform administrator access required.");
  }
  return { ...session.user, platformRole: currentUser.platformRole };
}
