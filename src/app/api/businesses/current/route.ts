import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ name: z.string().trim().min(2).max(191), description: z.string().trim().max(2000).nullable(), email: z.union([z.email().max(191), z.literal("")]).nullable(), phone: z.string().trim().max(40).nullable(), address: z.string().trim().max(1000).nullable(), taxId: z.string().trim().max(100).nullable(), website: z.union([z.url().max(255), z.literal("")]).nullable(), currency: z.string().regex(/^[A-Z]{3}$/), timezone: z.string().trim().min(1).max(64) }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("business.view");
    const business = await prisma.business.findFirst({ where: { id: context.businessId, deletedAt: null }, select: { id: true, name: true, type: true, description: true, email: true, phone: true, address: true, taxId: true, website: true, currency: true, timezone: true, accountStatus: true, createdAt: true } });
    return NextResponse.json({ data: business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Business profile could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("business.update");
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the business profile fields.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    const business = await prisma.$transaction(async (tx) => {
      const updated = await tx.business.update({ where: { id: context.businessId, deletedAt: null }, data: { name: data.name, description: data.description || null, email: data.email || null, phone: data.phone || null, address: data.address || null, taxId: data.taxId || null, website: data.website || null, currency: data.currency, timezone: data.timezone }, select: { id: true, name: true } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "business.profile_updated", entity: "business", entityId: context.businessId } });
      return updated;
    });
    return NextResponse.json({ data: business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Business profile update failed", error);
    return NextResponse.json({ error: "Business profile could not be updated." }, { status: 500 });
  }
}
