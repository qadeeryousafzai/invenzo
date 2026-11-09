import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ title: z.string().trim().min(2).max(191), category: z.string().trim().min(2).max(120), amount: z.number().positive().max(999999999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001), notes: z.string().trim().max(1000).optional(), incurredAt: z.iso.datetime().optional() }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("finance.view");
    const data = await prisma.expense.findMany({ where: { businessId: context.businessId }, orderBy: { incurredAt: "desc" }, take: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Expenses could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("expenses.manage");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the expense details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { amount, incurredAt, ...rest } = parsed.data;
    const data = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({ data: { businessId: context.businessId, ...rest, amount: new Prisma.Decimal(amount.toFixed(2)), incurredAt: incurredAt ? new Date(incurredAt) : new Date(), createdById: context.userId } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "expense.created", entity: "expense", entityId: expense.id } });
      return expense;
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Expense could not be saved." }, { status: 500 });
  }
}
