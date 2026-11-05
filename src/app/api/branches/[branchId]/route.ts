import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ name: z.string().trim().min(2).max(191), code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/), phone: z.string().trim().max(40).optional().nullable(), address: z.string().trim().max(1000).optional().nullable(), managerId: z.string().optional().nullable(), latitude: z.number().min(-90).max(90).optional().nullable(), longitude: z.number().min(-180).max(180).optional().nullable(), businessHours: z.record(z.string(), z.string().max(100)).optional().nullable(), status: z.enum(["ACTIVE", "INACTIVE"]) }).strict();

export async function PATCH(request: Request, route: { params: Promise<{ branchId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("branches.manage");
    const { branchId } = await route.params;
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the branch details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    if (data.managerId) {
      const manager = await prisma.membership.findFirst({ where: { businessId: context.businessId, userId: data.managerId, status: "ACTIVE" }, select: { id: true } });
      if (!manager) return NextResponse.json({ error: "Branch manager must be an active member of this workspace." }, { status: 400 });
    }
    const branch = await prisma.$transaction(async (tx) => {
      const updated = await tx.branch.update({ where: { id: branchId, businessId: context.businessId, deletedAt: null }, data: { name: data.name, code: data.code.toUpperCase(), phone: data.phone, address: data.address, managerId: data.managerId, latitude: data.latitude, longitude: data.longitude, businessHours: data.businessHours === null ? Prisma.DbNull : data.businessHours, status: data.status } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "branch.updated", entity: "branch", entityId: branchId } });
      return updated;
    });
    return NextResponse.json({ data: branch });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Branch not found in this workspace." }, { status: 404 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That branch code is already used in this workspace." }, { status: 409 });
    console.error("Branch update failed", error);
    return NextResponse.json({ error: "Branch could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, route: { params: Promise<{ branchId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("branches.manage");
    const { branchId } = await route.params;
    await prisma.$transaction(async (tx) => {
      await tx.branch.update({ where: { id: branchId, businessId: context.businessId, deletedAt: null }, data: { deletedAt: new Date(), status: "INACTIVE" } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "branch.archived", entity: "branch", entityId: branchId } });
    });
    return NextResponse.json({ message: "Branch archived." });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Branch not found in this workspace." }, { status: 404 });
    console.error("Branch archive failed", error);
    return NextResponse.json({ error: "Branch could not be archived." }, { status: 500 });
  }
}
