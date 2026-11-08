import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { originError, originIsAllowed } from "@/lib/http";

const branchSchema = z.object({
  name: z.string().trim().min(2).max(191),
  code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(1000).optional(),
  managerId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  businessHours: z.record(z.string(), z.string().max(100)).optional(),
}).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("branches.view");
    const branches = await prisma.branch.findMany({
      where: { businessId: context.businessId, deletedAt: null },
      select: { id: true, name: true, code: true, phone: true, address: true, latitude: true, longitude: true, status: true, createdAt: true, manager: { select: { id: true, name: true, email: true } }, _count: { select: { warehouses: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: branches });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Branch list failed", error);
    return NextResponse.json({ error: "Branches could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const limit = rateLimit(`branch-create:${requestIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  try {
    const context = await requireTenantContext("branches.manage");
    const body = await request.json().catch(() => null);
    const parsed = branchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the branch details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    if (data.managerId) {
      const manager = await prisma.membership.findFirst({ where: { businessId: context.businessId, userId: data.managerId, status: "ACTIVE" }, select: { id: true } });
      if (!manager) return NextResponse.json({ error: "Branch manager must be an active member of this workspace." }, { status: 400 });
    }
    const branch = await prisma.$transaction(async (tx) => {
      const created = await tx.branch.create({
        data: {
          businessId: context.businessId,
          name: data.name,
          code: data.code.toUpperCase(),
          phone: data.phone,
          address: data.address,
          managerId: data.managerId,
          latitude: data.latitude,
          longitude: data.longitude,
          businessHours: data.businessHours,
          warehouses: { create: { name: "Main warehouse", code: "MAIN" } },
        },
      });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "branch.created", entity: "branch", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That branch code is already used in this workspace." }, { status: 409 });
    console.error("Branch creation failed", error);
    return NextResponse.json({ error: "Branch could not be created." }, { status: 500 });
  }
}
