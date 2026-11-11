import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const patchSchema = z.object({ title: z.string().trim().min(2).max(191).optional(), category: z.string().trim().min(2).max(120).optional(), amount: z.number().positive().max(999999999).optional(), paymentMethod: z.string().trim().max(50).nullable().optional(), reference: z.string().trim().max(191).nullable().optional(), notes: z.string().trim().max(4000).nullable().optional(), date: z.iso.datetime().optional() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!originIsAllowed(request)) return originError();
  const { id } = await params;
  try {
    const context = await requireTenantContext("finance.view");
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the income details." }, { status: 400 });
    const { amount, date, ...rest } = parsed.data;
    const data = await prisma.$transaction(async (tx) => {
      const existing = await tx.income.findFirst({ where: { id, businessId: context.businessId } });
      if (!existing) return null;
      const income = await tx.income.update({ where: { id }, data: { ...rest, ...(amount !== undefined ? { amount: new Prisma.Decimal(amount.toFixed(2)) } : {}), ...(date ? { date: new Date(date) } : {}) } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "income.updated", entity: "income", entityId: income.id } });
      return income;
    });
    if (!data) return NextResponse.json({ error: "Income not found." }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Income could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!originIsAllowed(request)) return originError();
  const { id } = await params;
  try {
    const context = await requireTenantContext("finance.view");
    const data = await prisma.$transaction(async (tx) => {
      const existing = await tx.income.findFirst({ where: { id, businessId: context.businessId } });
      if (!existing) return null;
      await tx.income.delete({ where: { id } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "income.deleted", entity: "income", entityId: id } });
      return { id };
    });
    if (!data) return NextResponse.json({ error: "Income not found." }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Income could not be deleted." }, { status: 500 });
  }
}