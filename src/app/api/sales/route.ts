import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { planStockConsumption } from "@/modules/inventory/stock";

const itemSchema = z.object({
  productListingId: z.string().min(1),
  quantity: z.number().positive().max(999999999).refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001),
}).strict();

const schema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
  discount: z.number().min(0).max(999999999).optional(),
  tax: z.number().min(0).max(999999999).optional(),
  paymentMethod: z.enum(["cash", "card", "other"]).optional(),
  amountTendered: z.number().min(0).max(999999999).optional(),
  items: z.array(itemSchema).min(1).max(50),
}).strict();

class InsufficientStockError extends Error {}

const money = (value: Prisma.Decimal | number) => new Prisma.Decimal(value).toDecimalPlaces(2);

export async function GET() {
  try {
    const context = await requireTenantContext("sales.view");
    const data = await prisma.sale.findMany({
      where: { businessId: context.businessId },
      include: {
        customer: { select: { id: true, name: true } },
        branch: { select: { name: true } },
        items: { include: { listing: { include: { product: { select: { name: true, sku: true } } } } } },
      },
      orderBy: { soldAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Sales could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("sales.create");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check the sale and item details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    const listingIds = [...new Set(data.items.map((item) => item.productListingId))];
    const [branch, customer, listings] = await Promise.all([
      prisma.branch.findFirst({ where: { id: data.branchId, businessId: context.businessId, status: "ACTIVE", deletedAt: null }, select: { id: true } }),
      data.customerId ? prisma.customer.findFirst({ where: { id: data.customerId, businessId: context.businessId, deletedAt: null }, select: { id: true } }) : Promise.resolve(null),
      prisma.productListing.findMany({ where: { id: { in: listingIds }, businessId: context.businessId, branchId: data.branchId }, select: { id: true, price: true, product: { select: { name: true } } } }),
    ]);
    if (!branch) return NextResponse.json({ error: "Choose an active branch in this workspace." }, { status: 400 });
    if (data.customerId && !customer) return NextResponse.json({ error: "Choose a customer from this workspace." }, { status: 400 });
    if (listings.length !== listingIds.length) return NextResponse.json({ error: "Every sale item must be a product in the selected branch." }, { status: 400 });
    const priceByListing = new Map(listings.map((listing) => [listing.id, listing.price]));
    const lineTotals = data.items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity.toFixed(3));
      const unitPrice = priceByListing.get(item.productListingId)!;
      return { item, quantity, unitPrice, lineTotal: quantity.mul(unitPrice).toDecimalPlaces(2) };
    });
    const subtotal = lineTotals.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0)).toDecimalPlaces(2);
    const discount = money(Math.max(0, Math.min(Number(data.discount ?? 0), subtotal.toNumber())));
    const taxable = Prisma.Decimal.max(new Prisma.Decimal(0), subtotal.minus(discount));
    const requestedTax = money(Math.max(0, Number(data.tax ?? 0)));
    const tax = Prisma.Decimal.min(requestedTax, taxable);
    const total = money(taxable.plus(tax));
    const paymentMethod = data.paymentMethod ?? "cash";
    const tendered = money(Math.max(Number(data.amountTendered ?? 0), total.toNumber()));
    if (paymentMethod === "cash" && tendered.lessThan(total)) {
      return NextResponse.json({ error: "Cash received must be at least the grand total." }, { status: 400 });
    }
    const change = paymentMethod === "cash" ? money(tendered.minus(total)) : money(0);
    const notes = [
      data.notes?.trim(),
      discount.greaterThan(0) ? `Discount: ${discount.toFixed(2)}` : "",
      tax.greaterThan(0) ? `Tax: ${tax.toFixed(2)}` : "",
      `Payment: ${paymentMethod.toUpperCase()}`,
      paymentMethod === "cash" ? `Received: ${tendered.toFixed(2)}` : "",
      paymentMethod === "cash" ? `Change: ${change.toFixed(2)}` : "",
    ].filter(Boolean).join(" | ") || undefined;
    const reference = `SO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      for (const row of lineTotals) {
        const now = new Date();
        const batches = await tx.inventoryBatch.findMany({ where: { businessId: context.businessId, productListingId: row.item.productListingId, archivedAt: null, quantityRemaining: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] }, orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }], select: { id: true, quantityRemaining: true, expiryDate: true, receivedAt: true } });
        const allocations = planStockConsumption(row.quantity.toNumber(), batches.map((batch) => ({ id: batch.id, quantityRemaining: batch.quantityRemaining.toString(), expiryDate: batch.expiryDate, receivedAt: batch.receivedAt })), now);
        if (!allocations) throw new InsufficientStockError();
      }

      const sale = await tx.sale.create({
        data: {
          businessId: context.businessId,
          branchId: branch.id,
          customerId: customer?.id,
          reference,
          notes,
          total,
          // `businessId` is part of the compound (saleId, businessId) relation and is
          // filled by Prisma, so it must not be passed inside the nested create.
          items: { create: lineTotals.map(({ item, quantity, unitPrice, lineTotal }) => ({ productListingId: item.productListingId, quantity, unitPrice, lineTotal })) },
        },
        include: { items: true, customer: { select: { name: true } }, branch: { select: { name: true } } },
      });

      for (const item of sale.items) {
        const now = new Date();
        const batches = await tx.inventoryBatch.findMany({ where: { businessId: context.businessId, productListingId: item.productListingId, archivedAt: null, quantityRemaining: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] }, orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }] });
        const allocations = planStockConsumption(item.quantity.toNumber(), batches.map((batch) => ({ id: batch.id, quantityRemaining: batch.quantityRemaining.toString(), expiryDate: batch.expiryDate, receivedAt: batch.receivedAt })), now);
        if (!allocations) throw new InsufficientStockError();
        for (const allocation of allocations) {
          const amount = new Prisma.Decimal(allocation.quantity.toFixed(3));
          const update = await tx.inventoryBatch.updateMany({ where: { id: allocation.batchId, businessId: context.businessId, quantityRemaining: { gte: amount } }, data: { quantityRemaining: { decrement: amount } } });
          if (update.count !== 1) throw new InsufficientStockError();
          await tx.stockMovement.create({ data: { businessId: context.businessId, productListingId: item.productListingId, inventoryBatchId: allocation.batchId, actorId: context.userId, type: "SALE", quantityChange: amount.negated(), reference: sale.reference, note: `Stock sold (POS, ${paymentMethod})` } });
        }
      }
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "sale.created", entity: "sale", entityId: sale.id, metadata: { total: total.toFixed(2), subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), tax: tax.toFixed(2), itemCount: data.items.length, paymentMethod } } });
      return sale;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof InsufficientStockError || (error instanceof Error && "code" in error && error.code === "P2034")) return NextResponse.json({ error: "There is not enough available, unexpired stock to complete this sale. No stock was changed." }, { status: 409 });
    console.error("Sale creation failed", error);
    return NextResponse.json({ error: "Sale could not be saved." }, { status: 500 });
  }
}
