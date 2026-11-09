import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({ branchId: z.string().min(1), supplierId: z.string().optional(), notes: z.string().trim().max(1000).optional(), purchasedAt: z.iso.datetime().optional(), items: z.array(z.object({ productListingId: z.string().min(1), quantity: z.number().positive().max(999999999).refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001), unitCost: z.number().min(0).max(999999999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001), batchNumber: z.string().trim().min(1).max(64), expiryDate: z.iso.datetime().optional() }).strict()).min(1).max(50) }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("purchases.manage");
    const data = await prisma.purchase.findMany({ where: { businessId: context.businessId }, include: { supplier: { select: { id: true, name: true } }, branch: { select: { name: true } }, items: { include: { listing: { include: { product: { select: { name: true, sku: true } } } } } } }, orderBy: { purchasedAt: "desc" }, take: 200 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Purchases could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("purchases.manage");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the purchase and item details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    const [branch, supplier, listings] = await Promise.all([
      prisma.branch.findFirst({ where: { id: data.branchId, businessId: context.businessId, status: "ACTIVE", deletedAt: null }, select: { id: true } }),
      data.supplierId ? prisma.supplier.findFirst({ where: { id: data.supplierId, businessId: context.businessId, deletedAt: null }, select: { id: true } }) : Promise.resolve(null),
      prisma.productListing.findMany({ where: { id: { in: [...new Set(data.items.map((item) => item.productListingId))] }, businessId: context.businessId, branchId: data.branchId }, select: { id: true } }),
    ]);
    if (!branch) return NextResponse.json({ error: "Choose an active branch in this workspace." }, { status: 400 });
    if (data.supplierId && !supplier) return NextResponse.json({ error: "Choose a supplier from this workspace." }, { status: 400 });
    if (listings.length !== new Set(data.items.map((item) => item.productListingId)).size) return NextResponse.json({ error: "Every purchase item must be a product in the selected branch." }, { status: 400 });
    if (data.items.some((item) => item.expiryDate && new Date(item.expiryDate) <= new Date())) return NextResponse.json({ error: "Received stock cannot already be expired." }, { status: 400 });

    const reference = `PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const totals = data.items.map((item) => ({ item, quantity: new Prisma.Decimal(item.quantity.toFixed(3)), unitCost: new Prisma.Decimal(item.unitCost.toFixed(2)) }));
    const total = totals.reduce((sum, item) => sum.plus(item.quantity.mul(item.unitCost).toDecimalPlaces(2)), new Prisma.Decimal(0)).toDecimalPlaces(2);
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({ data: { businessId: context.businessId, branchId: branch.id, supplierId: supplier?.id, reference, notes: data.notes, total, purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : new Date(), items: { create: totals.map(({ item, quantity, unitCost }) => ({ businessId: context.businessId, productListingId: item.productListingId, quantity, unitCost, lineTotal: quantity.mul(unitCost).toDecimalPlaces(2), batchNumber: item.batchNumber, expiryDate: item.expiryDate ? new Date(item.expiryDate) : null })) } }, include: { items: true } });
      for (const item of purchase.items) {
        const batch = await tx.inventoryBatch.create({ data: { businessId: context.businessId, productListingId: item.productListingId, batchNumber: item.batchNumber, quantityRemaining: item.quantity, expiryDate: item.expiryDate, receivedAt: purchase.purchasedAt } });
        await tx.stockMovement.create({ data: { businessId: context.businessId, productListingId: item.productListingId, inventoryBatchId: batch.id, actorId: context.userId, type: "PURCHASE", quantityChange: item.quantity, unitCost: item.unitCost, reference: purchase.reference, note: "Stock received from purchase" } });
      }
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "purchase.received", entity: "purchase", entityId: purchase.id, metadata: { total: total.toFixed(2), itemCount: data.items.length } } });
      return purchase;
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A batch number is already used for one of these products." }, { status: 409 });
    console.error("Purchase creation failed", error);
    return NextResponse.json({ error: "Purchase could not be saved." }, { status: 500 });
  }
}
