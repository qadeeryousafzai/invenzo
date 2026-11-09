import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext("reports.view");
    const params = new URL(request.url).searchParams;
    const now = new Date();
    const from = params.get("from") ? new Date(params.get("from")!) : new Date(now.getFullYear(), now.getMonth(), 1);
    const until = params.get("until") ? new Date(params.get("until")!) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(until.getTime()) || from >= until || until > new Date(now.getTime() + 86400000)) return NextResponse.json({ error: "Choose a valid reporting period." }, { status: 400 });
    const dateFilter = { gte: from, lt: until };
    const [sales, purchases, expenses, stockTotals, noStockListings, topItems] = await Promise.all([
      prisma.sale.aggregate({ where: { businessId: context.businessId, soldAt: dateFilter }, _sum: { total: true }, _count: { _all: true } }),
      prisma.purchase.aggregate({ where: { businessId: context.businessId, purchasedAt: dateFilter }, _sum: { total: true }, _count: { _all: true } }),
      prisma.expense.aggregate({ where: { businessId: context.businessId, incurredAt: dateFilter }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.inventoryBatch.groupBy({ by: ["productListingId"], where: { businessId: context.businessId, archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] }, _sum: { quantityRemaining: true } }),
      prisma.productListing.findMany({ where: { businessId: context.businessId, product: { deletedAt: null }, batches: { none: { archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] } } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } }, orderBy: { product: { name: "asc" } }, take: 500 }),
      prisma.saleItem.groupBy({ by: ["productListingId"], where: { businessId: context.businessId, sale: { soldAt: dateFilter } }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    ]);
    const listingIds = topItems.map((item) => item.productListingId);
    const names = listingIds.length ? await prisma.productListing.findMany({ where: { id: { in: listingIds }, businessId: context.businessId }, include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } }) : [];
    const byId = new Map(names.map((listing) => [listing.id, listing]));
    const lowStockIds = stockTotals.filter((item) => Number(item._sum.quantityRemaining ?? 0) <= 5).map((item) => item.productListingId);
    const lowStockListings = lowStockIds.length ? await prisma.productListing.findMany({ where: { id: { in: lowStockIds }, businessId: context.businessId, product: { deletedAt: null } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } } }) : [];
    const stockByListing = new Map(stockTotals.map((item) => [item.productListingId, Number(item._sum.quantityRemaining ?? 0)]));
    const lowStock = [...lowStockListings.map((listing) => ({ product: listing.product.name, sku: listing.product.sku, unit: listing.product.unit, branch: listing.branch.name, quantity: stockByListing.get(listing.id) ?? 0 })), ...noStockListings.map((listing) => ({ product: listing.product.name, sku: listing.product.sku, unit: listing.product.unit, branch: listing.branch.name, quantity: 0 }))].sort((a, b) => a.quantity - b.quantity).slice(0, 20);
    const data = {
      from: from.toISOString(), until: until.toISOString(),
      revenue: Number(sales._sum.total ?? 0), saleCount: sales._count._all,
      purchaseSpend: Number(purchases._sum.total ?? 0), purchaseCount: purchases._count._all,
      expenses: Number(expenses._sum.amount ?? 0), expenseCount: expenses._count._all,
      netCashFlow: Number(sales._sum.total ?? 0) - Number(purchases._sum.total ?? 0) - Number(expenses._sum.amount ?? 0),
      lowStock,
      topItems: topItems.map((item) => ({ name: byId.get(item.productListingId)?.product.name ?? "Archived product", sku: byId.get(item.productListingId)?.product.sku ?? "", branch: byId.get(item.productListingId)?.branch.name ?? "", quantity: Number(item._sum.quantity ?? 0), revenue: Number(item._sum.lineTotal ?? 0) })),
    };
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) return NextResponse.json({ error: "Reporting modules need the latest database migrations." }, { status: 503 });
    console.error("Report generation failed", error);
    return NextResponse.json({ error: "Reports could not be generated." }, { status: 500 });
  }
}
