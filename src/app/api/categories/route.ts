import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional() }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("products.view");
    const data = await prisma.category.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { name: "asc" }, take: 200 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Categories could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("categories.manage");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid category name.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({ data: { businessId: context.businessId, ...parsed.data } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "category.created", entity: "category", entityId: category.id } });
      return category;
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
    return NextResponse.json({ error: "Category could not be created." }, { status: 500 });
  }
}
