import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { normalizeName } from "@/modules/catalog/normalize";

export const dynamic = "force-dynamic";

type StockAggregate = {
  stock: number;
  batchCount: number;
  nearestExpiry: Date | null;
  listingId: string | null;
  productId: string;
  productName: string;
  unit: string;
  branchId: string | null;
};

/**
 * Merged inventory + catalog listing.
 *
 * Every catalog medicine is returned, even when the workspace does not stock it
 * (stock = 0). Rows the workspace already carries expose their listing id so the
 * client can post stock movements against them.
 */
export async function GET(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("inventory.view");
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    const dosageForm = (url.searchParams.get("dosageForm") ?? "").trim();
    const countryCode = (url.searchParams.get("country") ?? "").trim().toUpperCase();
    const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? "24") || 24, 1), 100);

    const now = new Date();

    const listings = await prisma.productListing.findMany({
      where: { businessId: context.businessId, product: { deletedAt: null } },
      select: {
        id: true,
        branchId: true,
        branch: { select: { name: true, status: true } },
        product: { select: { id: true, name: true, unit: true, catalogMedicineId: true } },
        batches: {
          where: { archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
          select: { quantityRemaining: true, expiryDate: true },
        },
      },
      take: 5000,
    });

    const byCatalogId = new Map<string, StockAggregate>();
    const byName = new Map<string, StockAggregate>();

    for (const listing of listings) {
      const available = listing.batches.reduce((sum, batch) => sum + Number(batch.quantityRemaining), 0);
      const expiries = listing.batches
        .map((batch) => batch.expiryDate)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => a.getTime() - b.getTime());
      const aggregate: StockAggregate = {
        stock: available,
        batchCount: listing.batches.length,
        nearestExpiry: expiries[0] ?? null,
        listingId: listing.id,
        productId: listing.product.id,
        productName: listing.product.name,
        unit: listing.product.unit,
        branchId: listing.branchId,
      };

      if (listing.product.catalogMedicineId && !byCatalogId.has(listing.product.catalogMedicineId)) {
        byCatalogId.set(listing.product.catalogMedicineId, aggregate);
      }
      const key = normalizeName(listing.product.name);
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, aggregate);
      } else if (available > existing.stock) {
        byName.set(key, aggregate);
      }
    }

    const filters = [];
    if (query) {
      filters.push({
        OR: [
          { displayName: { contains: query } },
          { genericName: { contains: query } },
          { brandName: { contains: query } },
          { searchText: { contains: query } },
          { strengthText: { contains: query } },
        ],
      });
    }
    if (dosageForm) filters.push({ dosageForm: { contains: dosageForm } });
    if (countryCode) filters.push({ countryCode });

    const where = filters.length ? { AND: filters } : undefined;

    const [total, catalogRows] = await Promise.all([
      prisma.medicine.count({ where }),
      prisma.medicine.findMany({
        where,
        orderBy: [{ displayName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ingredients: { orderBy: { sortOrder: "asc" }, take: 3, select: { name: true, strengthText: true } },
          manufacturer: { select: { name: true } },
          source: { select: { key: true, name: true } },
        },
      }),
    ]);

    const rows = catalogRows.map((medicine) => {
      const aggregate =
        byCatalogId.get(medicine.id) ?? byName.get(normalizeName(medicine.brandName ?? medicine.genericName ?? medicine.displayName)) ?? null;
      return {
        key: `catalog:${medicine.id}`,
        source: "catalog" as const,
        catalogMedicineId: medicine.id,
        productId: aggregate?.productId ?? null,
        listingId: aggregate?.listingId ?? null,
        branchId: aggregate?.branchId ?? null,
        name: medicine.displayName,
        genericName: medicine.genericName,
        brandName: medicine.brandName,
        strengthText: medicine.strengthText,
        dosageForm: medicine.dosageForm,
        manufacturer: medicine.manufacturer?.name ?? null,
        countryCode: medicine.countryCode,
        sourceName: medicine.source.name,
        unit: aggregate?.unit ?? "unit",
        stock: aggregate?.stock ?? 0,
        batchCount: aggregate?.batchCount ?? 0,
        nearestExpiry: aggregate?.nearestExpiry ?? null,
        stocked: Boolean(aggregate),
      };
    });

    // Workspace products that are not represented on this catalog page.
    if (query || page > 1) {
      return NextResponse.json({
        data: rows,
        meta: { page, pageSize, total, pageCount: Math.max(Math.ceil(total / pageSize), 1) },
      });
    }

    const pageNames = new Set(catalogRows.map((medicine) => normalizeName(medicine.brandName ?? medicine.genericName ?? medicine.displayName)));
    const custom = Array.from(byName.entries())
      .filter(([key]) => !pageNames.has(key))
      .slice(0, pageSize)
      .map(([, aggregate]) => ({
        key: `product:${aggregate.productId}`,
        source: "product" as const,
        catalogMedicineId: null,
        productId: aggregate.productId,
        listingId: aggregate.listingId,
        branchId: aggregate.branchId,
        name: aggregate.productName,
        genericName: null,
        brandName: null,
        strengthText: null,
        dosageForm: null,
        manufacturer: null,
        countryCode: null,
        sourceName: "Your inventory",
        unit: aggregate.unit,
        stock: aggregate.stock,
        batchCount: aggregate.batchCount,
        nearestExpiry: aggregate.nearestExpiry,
        stocked: true,
      }));

    return NextResponse.json({
      data: [...custom, ...rows],
      meta: { page, pageSize, total: total + custom.length, pageCount: Math.max(Math.ceil(total / pageSize), 1) },
    });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[inventory/catalog-medicines] failed", error);
    return NextResponse.json({ error: "The medicine list could not be loaded." }, { status: 500 });
  }
}