import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ title: z.string().trim().min(2).max(191), category: z.string().trim().min(2).max(120), amount: z.number().positive().max(999999999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001), paymentMethod: z.string().trim().max(50).optional(), reference: z.string().trim().max(191).optional(), notes: z.string().trim().max(4000).optional(), date: z.iso.datetime().optional() }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("finance.view");
    const data = await prisma.income.findMany({ where: { businessId: context.businessId }, orderBy: { date: "desc" }, take: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Income could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("finance.view");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the income details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { amount, date, ...rest } = parsed.data;
    const data = await prisma.$transaction(async (tx) => {
      const income = await tx.income.create({ data: { businessId: context.businessId, ...rest, amount: new Prisma.Decimal(amount.toFixed(2)), date: date ? new Date(date) : new Date(), createdById: context.userId } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "income.created", entity: "income", entityId: income.id } });
      return income;
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Income could not be saved." }, { status: 500 });
  }
}