import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { planStockConsumption } from "@/modules/inventory/stock";

const schema = z.object({ productListingId: z.string().min(1), quantityChange: z.number().refine((value) => value !== 0 && Math.abs(value) <= 999999999 && Math.abs(Math.abs(value) * 1000 - Math.round(Math.abs(value) * 1000)) < 0.000001), note: z.string().trim().min(3).max(500), batchNumber: z.string().trim().max(64).optional(), expiryDate: z.iso.datetime().optional() }).strict();
class StockAdjustmentError extends Error {}

export async function GET() {
  try {
    const context = await requireTenantContext("inventory.view");
    const data = await prisma.stockMovement.findMany({ where: { businessId: context.businessId }, include: { listing: { include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } } }, batch: { select: { batchNumber: true } }, actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Stock movements could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("inventory.adjust");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a non-zero adjustment and reason.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    const listing = await prisma.productListing.findFirst({ where: { id: data.productListingId, businessId: context.businessId }, select: { id: true } });
    if (!listing) return NextResponse.json({ error: "Choose a product in this workspace." }, { status: 400 });
    if (data.expiryDate && new Date(data.expiryDate) <= new Date() && data.quantityChange > 0) return NextResponse.json({ error: "New stock cannot be expired." }, { status: 400 });
    const result = await prisma.$transaction(async (tx) => {
      const reference = `ADJ-${randomBytes(4).toString("hex").toUpperCase()}`;
      const change = new Prisma.Decimal(Math.abs(data.quantityChange).toFixed(3));
      const created = [];
      if (data.quantityChange > 0) {
        const batch = await tx.inventoryBatch.create({ data: { businessId: context.businessId, productListingId: listing.id, batchNumber: data.batchNumber?.trim() || reference, quantityRemaining: change, expiryDate: data.expiryDate ? new Date(data.expiryDate) : null } });
        created.push(await tx.stockMovement.create({ data: { businessId: context.businessId, productListingId: listing.id, inventoryBatchId: batch.id, actorId: context.userId, type: "ADJUSTMENT", quantityChange: change, reference, note: data.note } }));
      } else {
        const now = new Date();
        const batches = await tx.inventoryBatch.findMany({ where: { businessId: context.businessId, productListingId: listing.id, archivedAt: null, quantityRemaining: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] }, orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }] });
        const allocations = planStockConsumption(Math.abs(data.quantityChange), batches.map((batch) => ({ id: batch.id, quantityRemaining: batch.quantityRemaining.toString(), expiryDate: batch.expiryDate, receivedAt: batch.receivedAt })), now);
        if (!allocations) throw new StockAdjustmentError();
        for (const allocation of allocations) {
          const amount = new Prisma.Decimal(allocation.quantity.toFixed(3));
          const update = await tx.inventoryBatch.updateMany({ where: { id: allocation.batchId, businessId: context.businessId, quantityRemaining: { gte: amount } }, data: { quantityRemaining: { decrement: amount } } });
          if (update.count !== 1) throw new StockAdjustmentError();
          created.push(await tx.stockMovement.create({ data: { businessId: context.businessId, productListingId: listing.id, inventoryBatchId: allocation.batchId, actorId: context.userId, type: "ADJUSTMENT", quantityChange: amount.negated(), reference, note: data.note } }));
        }
      }
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "inventory.adjusted", entity: "product_listing", entityId: listing.id, metadata: { quantityChange: data.quantityChange, note: data.note } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof StockAdjustmentError || (error instanceof Error && "code" in error && error.code === "P2034")) return NextResponse.json({ error: "Adjustment exceeds available unexpired stock. No stock was changed." }, { status: 409 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That batch number is already in use for this product." }, { status: 409 });
    console.error("Inventory adjustment failed", error);
    return NextResponse.json({ error: "Inventory could not be adjusted." }, { status: 500 });
  }
}
