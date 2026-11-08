import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { WorkspaceAccessNotice } from "@/components/dashboard/workspace-access-notice";
import { getTenantContext } from "@/lib/tenant-context";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.membership || !context.businessId) {
    if (session.user.platformRole === "SUPER_ADMIN") redirect("/super-admin");
    redirect("/register");
  }
  const active = context.membership;
  const accessStatus = getWorkspaceAccessStatus(active.business);
  if (accessStatus !== "ACTIVE") {
    return <WorkspaceAccessNotice businessName={active.business.name} status={accessStatus} expiresAt={active.business.subscriptionExpiresAt?.toISOString() ?? null} />;
  }
  const workspaces = context.memberships.map((membership) => ({ id: membership.businessId, name: membership.business.name, role: membership.role.name }));
  return <WorkspaceShell businessName={active.business.name} businessType={active.business.type} activeId={active.businessId} workspaces={workspaces} userName={session?.user.name ?? session?.user.email ?? "Account"} roleName={active.role.name}>{children}</WorkspaceShell>;
}
