"use server";

import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { requireSuperAdmin } from "@/lib/tenant-context";

export async function getPosBusinesses() {
  await connection();
  await requireSuperAdmin();
  return prisma.business.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, type: true, currency: true },
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function getPosBranches(businessId: string) {
  await connection();
  await requireSuperAdmin();
  return prisma.branch.findMany({
    where: { businessId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getPosPlatformSettings() {
  await connection();
  await requireSuperAdmin();
  return prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
}

export async function getPosProducts(businessId: string, branchId: string, search?: string) {
  await connection();
  await requireSuperAdmin();
  return prisma.productListing.findMany({
    where: {
      businessId,
      branchId,
      product: { deletedAt: null },
      ...(search
        ? {
            OR: [
              { product: { name: { contains: search } } },
              { product: { sku: { contains: search } } },
              { product: { barcode: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      product: { select: { id: true, name: true, sku: true, barcode: true, unit: true } },
      batches: {
        where: { archivedAt: null, quantityRemaining: { gt: 0 } },
        orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }],
      },
    },
    orderBy: { product: { name: "asc" } },
    take: 100,
  });
}

export async function getPosNearExpiry(businessId: string) {
  await connection();
  await requireSuperAdmin();
  const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
  const now = new Date();
  const cutoff = new Date(now.getTime() + Number(settings.expiryWarningDays) * 86400000);
  return prisma.inventoryBatch.findMany({
    where: { businessId, archivedAt: null, quantityRemaining: { gt: 0 }, expiryDate: { lte: cutoff, gte: now } },
    include: { listing: { select: { product: { select: { name: true } } } } },
    orderBy: { expiryDate: "asc" },
    take: 50,
  });
}
  export async function createPosSale(_formData: FormData) {
  "use server";
  await connection();
  const admin = await requireSuperAdmin();
  const formData = _formData;
  const businessId = String(formData.get("businessId"));
  const branchId = String(formData.get("branchId"));
  const customerName = String(formData.get("customerName") || "").trim() || null;
  const rawItems = String(formData.get("items") || "[]");
  let items: Array<{ productListingId: string; inventoryBatchId: string; quantity: number; unitPrice: number }>;
  try {
    items = JSON.parse(rawItems);
  } catch {
    return { ok: false, error: "Invalid cart." };
  }
  if (!businessId || !branchId || !items.length) return { ok: false, error: "Business, branch, and at least one item are required." };

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reference = `POS-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;

  let total = 0;
  const planned: Array<{ listingId: string; batchId: string; quantity: number; unitPrice: number; lineTotal: number }> = [];

  const listings = await prisma.productListing.findMany({
    where: { businessId, id: { in: items.map((item) => item.productListingId) } },
    select: { id: true, price: true, businessId: true },
  });
  const listingById = Object.fromEntries(listings.map((listing) => [listing.id, listing]));

  const batches = await prisma.inventoryBatch.findMany({
    where: { businessId, id: { in: items.map((item) => item.inventoryBatchId) } },
    select: { id: true, productListingId: true, quantityRemaining: true, batchNumber: true, expiryDate: true },
  });
  const batchById = Object.fromEntries(batches.map((batch) => [batch.id, batch]));

  for (const item of items) {
    const listing = listingById[item.productListingId];
    const batch = batchById[item.inventoryBatchId];
    if (!listing || !batch) return { ok: false, error: "One or more items are no longer available." };
    if (listing.businessId !== businessId) return { ok: false, error: "Item does not belong to the selected business." };
    if (Number(batch.quantityRemaining) < item.quantity) {
      return { ok: false, error: `Insufficient stock for batch ${batch.batchNumber} (${Math.floor(Number(batch.quantityRemaining))} remaining).` };
    }
    const unitPrice = item.unitPrice > 0 ? item.unitPrice : Number(listing.price);
    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;
    planned.push({ listingId: listing.id, batchId: batch.id, quantity: item.quantity, unitPrice, lineTotal });
  }

  let saleId: string;
  try {
    saleId = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          businessId,
          branchId,
          reference,
          notes: customerName ? `Walk-in customer: ${customerName}` : "Point of sale",
          total: String(total),
          createdById: admin.id,
          items: {
            create: planned.map((item) => ({
              productListingId: item.listingId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        select: { id: true },
      });

      for (const item of planned) {
        await tx.inventoryBatch.update({
          where: { id: item.batchId },
          data: { quantityRemaining: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            businessId,
            productListingId: item.listingId,
            inventoryBatchId: item.batchId,
            actorId: admin.id,
            type: "SALE",
            quantityChange: String(-item.quantity),
            unitCost: String(item.unitPrice),
            reference,
            note: `POS sale ${reference}`,
          },
        });
      }
      return sale.id;
    });
  } catch {
    return { ok: false, error: "Sale could not be completed. Try again." };
  }

  const settings = await getPosPlatformSettings();
  const warningDays = Number(settings.expiryWarningDays) || 7;
  const cutoff = new Date(now.getTime() + warningDays * 86400000);
  const nearExpiry = await prisma.inventoryBatch.findMany({
    where: { businessId, archivedAt: null, quantityRemaining: { gt: 0 }, expiryDate: { lte: cutoff, gte: now } },
    include: { listing: { select: { product: { select: { name: true } } } } },
    take: 50,
  });
  if (nearExpiry.length) {
    await prisma.notification.createMany({
      data: nearExpiry.map((batch) => ({
        audience: "PLATFORM_ADMIN",
        userId: admin.id,
        businessId,
        type: "NEAR_EXPIRY",
        title: "Medicine near expiry",
        body: `${batch.listing.product.name} (batch ${batch.batchNumber}) has ${Math.floor(Number(batch.quantityRemaining))} units remaining and expires on ${batch.expiryDate?.toLocaleDateString()}.`,
        dedupeKey: `near-expiry:${batch.id}`,
      })),
    skipDuplicates: true,
  });
  }

  return { ok: true, saleId, reference, total, customerName };
}

export async function saveGeneralSettings(_formData: FormData) {
  "use server";
  void _formData;
  const defaultAccessMonths = Math.max(1, Math.min(120, Number(_formData.get("defaultAccessMonths")) || 1));
  const expiryWarningDays = Math.max(0, Math.min(90, Number(_formData.get("expiryWarningDays")) || 0));
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: { defaultAccessMonths, expiryWarningDays },
    create: { id: "default", defaultAccessMonths, expiryWarningDays },
  });
  return;
}

export async function savePharmacyProfile(_formData: FormData) {
  "use server";
  void _formData;
  const name = String(_formData.get("pharmacyName") || "").trim();
  if (!name) return;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function saveBusinessSettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function saveTaxSettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function savePaymentSettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function saveInvoiceSettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function saveNotificationSettings(_formData: FormData) {
  "use server";
  void _formData;
  const warningDays = Math.max(0, Math.min(90, Number(_formData.get("expiryWarningDays")) || 0));
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: { expiryWarningDays: warningDays }, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: warningDays } });
  return;
}

export async function saveSecuritySettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}

export async function saveAppearanceSettings(_formData: FormData) {
  "use server";
  void _formData;
  await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  return;
}
