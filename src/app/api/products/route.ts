import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const imageUrlSchema = z.url().max(2000).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Image URL must use HTTP or HTTPS.");
const createSchema = z.object({
  name: z.string().trim().min(2).max(191),
  sku: z.string().trim().min(1).max(64),
  barcode: z.string().trim().max(128).optional(),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  imageUrl: imageUrlSchema.optional(),
  unit: z.string().trim().min(1).max(32).default("unit"),
  branchId: z.string().min(1).max(191),
  price: z.number().positive().max(9999999999),
  initialQuantity: z.number().min(0).max(999999999).default(0),
  batchNumber: z.string().trim().max(64).optional(),
  expiryDate: z.iso.datetime().optional(),
  marketplaceEnabled: z.boolean().default(true),
  pickupEnabled: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(false),
}).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("products.view");
    const products = await prisma.product.findMany({
      where: { businessId: context.businessId, deletedAt: null },
      include: {
        listings: {
          where: { businessId: context.businessId },
          include: {
            branch: { select: { id: true, name: true, code: true, status: true } },
            batches: { where: { archivedAt: null }, select: { quantityRemaining: true, expiryDate: true, batchNumber: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const now = Date.now();
    const data = products.map(({ listings, ...product }) => ({
      ...product,
      listings: listings.map(({ batches, ...listing }) => ({
        ...listing,
        availableQuantity: batches.reduce((total, batch) => total + (batch.expiryDate && batch.expiryDate.getTime() <= now ? 0 : Number(batch.quantityRemaining)), 0),
        batchCount: batches.length,
      })),
    }));
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && (error.code === "P2021" || error.code === "P2022")) return NextResponse.json({ error: "Product management is not set up yet. Apply the Invenzo database migrations, then try again." }, { status: 503 });
    console.error("Product list failed", error);
    return NextResponse.json({ error: "Products could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const throttle = rateLimit(`product-create:${requestIp(request)}`, 60, 60 * 60 * 1000);
  if (!throttle.allowed) return NextResponse.json({ error: "Too many product changes. Try again later." }, { status: 429 });
  try {
    const context = await requireTenantContext("products.create");
    if (!context.permissions.has("inventory.adjust")) return NextResponse.json({ error: "Inventory adjustment permission is required to add opening stock." }, { status: 403 });
    const raw = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Check the product and stock details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = parsed.data;
    const branch = await prisma.branch.findFirst({ where: { id: data.branchId, businessId: context.businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true } });
    if (!branch) return NextResponse.json({ error: "Choose an active branch in this workspace." }, { status: 400 });
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (expiryDate && expiryDate.getTime() <= Date.now() && data.initialQuantity > 0) return NextResponse.json({ error: "Opening stock cannot be expired." }, { status: 400 });
    const batchNumber = data.batchNumber?.trim() || `OPEN-${randomBytes(5).toString("hex").toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId: context.businessId,
          name: data.name,
          sku: data.sku.toUpperCase(),
          barcode: data.barcode?.trim() || null,
          brand: data.brand || null,
          category: data.category || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          unit: data.unit,
        },
      });
      const listing = await tx.productListing.create({
        data: {
          businessId: context.businessId,
          productId: product.id,
          branchId: branch.id,
          price: new Prisma.Decimal(data.price.toFixed(2)),
          marketplaceEnabled: data.marketplaceEnabled,
          pickupEnabled: data.pickupEnabled,
          deliveryEnabled: data.deliveryEnabled,
        },
      });
      if (data.initialQuantity > 0) {
        await tx.inventoryBatch.create({ data: { businessId: context.businessId, productListingId: listing.id, batchNumber, quantityRemaining: new Prisma.Decimal(data.initialQuantity.toFixed(3)), expiryDate } });
      }
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "product.created", entity: "product", entityId: product.id, metadata: { branchId: branch.id } } });
      return { ...product, listings: [{ ...listing, branch }] };
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That SKU, barcode, or branch listing already exists in this workspace." }, { status: 409 });
    if (error instanceof Error && "code" in error && (error.code === "P2021" || error.code === "P2022")) return NextResponse.json({ error: "Product management is not set up yet. Apply the Invenzo database migrations, then try again." }, { status: 503 });
    console.error("Product creation failed", error);
    return NextResponse.json({ error: "Product could not be created." }, { status: 500 });
  }
}
