import { redirect } from "next/navigation";
import { TeamManagement } from "@/components/dashboard/team-management";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function EmployeesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.membership || !context.permissions?.has("employees.view")) return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold">Team access unavailable</h1><p className="mt-2 text-sm text-gray-600">Your assigned role does not include employee viewing permission.</p></div>;
  const [roles, memberships, invitations] = await Promise.all([
    prisma.role.findMany({ where: { businessId: context.businessId }, include: { permissions: { select: { permissionKey: true } } }, orderBy: [{ isSystem: "desc" }, { name: "asc" }] }),
    prisma.membership.findMany({ where: { businessId: context.businessId }, include: { user: { select: { id: true, name: true, email: true } }, role: { select: { id: true, name: true, key: true } } }, orderBy: { joinedAt: "asc" } }),
    prisma.membershipInvite.findMany({ where: { businessId: context.businessId, acceptedAt: null, expiresAt: { gt: new Date() } }, include: { role: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-black">ACCESS CONTROL</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Team & roles</h1><p className="mt-2 text-sm text-gray-600">Invite teammates and define what they can do in this workspace.</p></div><TeamManagement roles={roles} employees={memberships.map((membership) => ({ id: membership.id, status: membership.status, joinedAt: membership.joinedAt.toISOString(), user: membership.user, role: membership.role }))} invitations={invitations.map((invite) => ({ id: invite.id, email: invite.email, expiresAt: invite.expiresAt.toISOString(), role: invite.role }))} canInvite={context.permissions.has("employees.manage")} canCreateRoles={context.permissions.has("roles.manage")} /></div>;
}
