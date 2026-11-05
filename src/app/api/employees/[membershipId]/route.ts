import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export async function PATCH(request: Request, route: { params: Promise<{ membershipId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("employees.manage");
    const { membershipId } = await route.params;
    const body = await request.json().catch(() => null);
    const parsed = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).strict().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid membership status." }, { status: 400 });
    const membership = await prisma.membership.findFirst({ where: { id: membershipId, businessId: context.businessId }, include: { role: { select: { key: true } }, user: { select: { id: true } } } });
    if (!membership) return NextResponse.json({ error: "Workspace member not found." }, { status: 404 });
    if (membership.role.key === "OWNER") return NextResponse.json({ error: "The business owner membership cannot be suspended or changed here." }, { status: 403 });
    if (membership.user.id === context.userId && parsed.data.status === "SUSPENDED") return NextResponse.json({ error: "You cannot suspend your own workspace membership." }, { status: 400 });
    await prisma.$transaction(async (tx) => {
      await tx.membership.update({ where: { id: membershipId, businessId: context.businessId }, data: { status: parsed.data.status } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: parsed.data.status === "SUSPENDED" ? "employee.suspended" : "employee.reactivated", entity: "membership", entityId: membershipId } });
    });
    return NextResponse.json({ message: parsed.data.status === "SUSPENDED" ? "Workspace access suspended." : "Workspace access restored." });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Membership update failed", error);
    return NextResponse.json({ error: "Workspace membership could not be updated." }, { status: 500 });
  }
}
