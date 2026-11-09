import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ name: z.string().trim().min(2).max(191), email: z.email().max(191).optional().or(z.literal("")), phone: z.string().trim().max(40).optional(), address: z.string().trim().max(2000).optional(), notes: z.string().trim().max(4000).optional() }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("sales.view");
    const data = await prisma.customer.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { name: "asc" }, take: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Customers could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("customers.manage");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the customer details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { email, ...rest } = parsed.data;
    const data = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({ data: { businessId: context.businessId, ...rest, email: email?.trim().toLowerCase() || null } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "customer.created", entity: "customer", entityId: customer.id } });
      return customer;
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Customer could not be created." }, { status: 500 });
  }
}
