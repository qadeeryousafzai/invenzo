import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requirePageTenant } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  await connection();
  const context = await requirePageTenant();
  if (!context.businessId || !context.membership) redirect("/register");
  if (!context.permissions?.has("business.view")) {
    return (
      <div className="surface-card p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Workspace overview unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">Your assigned role does not include business viewing permission.</p>
      </div>
    );
  }

  const businessId = context.businessId;
  const currency = context.membership.business.currency || "USD";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalMedicines,
    lowStockCount,
    expiringSoonCount,
    totalCustomers,
    todaySalesAgg,
    todayPurchasesAgg,
    monthRevenueAgg,
    monthExpenseAgg,
    monthPurchaseAgg,
    lastMonthRevenueAgg,
    recentSales,
    recentPurchases,
    lowStockMedicines,
    expiringMedicines,
    topSellingRaw,
    salesChartData,
    revenueChartData,
    categoryChartData,
  ] = await Promise.all([
    prisma.product.count({ where: { businessId, deletedAt: null } }),
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) as count FROM (
        SELECT pl.id
        FROM \`product_listings\` pl
        INNER JOIN \`products\` p ON p.id = pl.productId AND p.businessId = pl.businessId
        LEFT JOIN \`inventory_batches\` ib ON ib.productListingId = pl.id AND ib.businessId = pl.businessId
          AND ib.quantityRemaining > 0 AND ib.archivedAt IS NULL AND (ib.expiryDate IS NULL OR ib.expiryDate >= ${now})
        WHERE pl.businessId = ${businessId} AND p.deletedAt IS NULL
        GROUP BY pl.id
        HAVING COALESCE(SUM(ib.quantityRemaining), 0) <= 10
      ) x
    `,
    prisma.inventoryBatch.count({
      where: { businessId, quantityRemaining: { gt: 0 }, archivedAt: null, expiryDate: { gte: now, lte: in30Days } },
    }),
    prisma.customer.count({ where: { businessId, deletedAt: null } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfToday } }, _sum: { total: true }, _count: true }),
    prisma.purchase.aggregate({ where: { businessId, purchasedAt: { gte: startOfToday } }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { businessId, incurredAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where: { businessId, purchasedAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { total: true } }),
    prisma.sale.findMany({
      where: { businessId },
      select: { id: true, reference: true, total: true, soldAt: true, customer: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { soldAt: "desc" }, take: 6,
    }),
    prisma.purchase.findMany({
      where: { businessId },
      select: { id: true, reference: true, total: true, purchasedAt: true, supplier: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { purchasedAt: "desc" }, take: 6,
    }),
    prisma.productListing.findMany({
      where: { businessId, product: { deletedAt: null } },
      select: { id: true, product: { select: { name: true, sku: true } }, branch: { select: { name: true } }, batches: { where: { quantityRemaining: { gt: 0 }, archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] }, select: { quantityRemaining: true } } },
      take: 200,
    }),
    prisma.inventoryBatch.findMany({
      where: { businessId, quantityRemaining: { gt: 0 }, archivedAt: null, expiryDate: { gte: now, lte: in30Days } },
      select: { id: true, quantityRemaining: true, expiryDate: true, listing: { select: { product: { select: { name: true } }, branch: { select: { name: true } } } } },
      orderBy: { expiryDate: "asc" }, take: 8,
    }),
    prisma.saleItem.groupBy({
      by: ["productListingId"],
      where: { sale: { businessId, soldAt: { gte: startOfMonth } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ date: Date | string; total: number | string; count: number | string }>>`
      SELECT DATE(soldAt) as date, COALESCE(SUM(total),0) as total, COUNT(*) as count
      FROM \`sales\` WHERE businessId = ${businessId} AND soldAt >= ${startOfMonth}
      GROUP BY DATE(soldAt) ORDER BY DATE(soldAt) ASC
    `,
    prisma.$queryRaw<Array<{ date: Date | string; revenue: number | string }>>`
      SELECT DATE(soldAt) as date, COALESCE(SUM(total),0) as revenue
      FROM \`sales\` WHERE businessId = ${businessId} AND soldAt >= ${sixMonthsAgo}
      GROUP BY DATE(soldAt) ORDER BY DATE(soldAt) ASC
    `,
    prisma.$queryRaw<Array<{ category: string; count: number | string }>>`
      SELECT COALESCE(NULLIF(p.category,''), 'Uncategorized') as category, COUNT(*) as count
      FROM \`products\` p WHERE p.businessId = ${businessId} AND p.deletedAt IS NULL
      GROUP BY COALESCE(NULLIF(p.category,''), 'Uncategorized') ORDER BY count DESC LIMIT 6
    `,
  ]);

  const lowStock = lowStockMedicines
    .map((item) => ({ ...item, stock: item.batches.reduce((sum, b) => sum + Number(b.quantityRemaining ?? 0), 0) }))
    .filter((item) => item.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  const topListingIds = topSellingRaw.map((r) => r.productListingId);
  const topListings = topListingIds.length ? await prisma.productListing.findMany({
    where: { id: { in: topListingIds }, businessId },
    select: { id: true, product: { select: { name: true } }, branch: { select: { name: true } } },
  }) : [];
  const listingMap = new Map(topListings.map((l) => [l.id, l]));
  const topSellingMedicines = topSellingRaw.map((row) => ({
    productListingId: row.productListingId,
    name: listingMap.get(row.productListingId)?.product.name ?? "Medicine",
    branch: listingMap.get(row.productListingId)?.branch.name ?? "",
    quantity: Number(row._sum?.quantity ?? 0),
    revenue: Number(row._sum?.lineTotal ?? 0),
  }));

  const totalRevenue = Number(monthRevenueAgg._sum.total ?? 0);
  const totalExpenses = Number(monthExpenseAgg._sum.amount ?? 0);
  const totalPurchases = Number(monthPurchaseAgg._sum.total ?? 0);
  const netProfit = totalRevenue - totalExpenses; // simple: revenue minus recorded expenses (COGS/purchases tracked separately)
  const lastMonthRevenue = Number(lastMonthRevenueAgg._sum.total ?? 0);
  const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const lowStockTotal = Number(lowStockCount[0]?.count ?? 0);

  return (
    <DashboardClient
      businessName={context.membership.business.name}
      greetingName={context.membership.role.name.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
      currency={currency}
      permissions={Array.from(context.permissions ?? [])}
      stats={{
        todaySales: Number(todaySalesAgg._count ?? 0),
        totalRevenue,
        totalMedicines,
        totalCustomers,
        lowStock: lowStockTotal || lowStock.length,
        expiringSoon: expiringSoonCount,
        todayPurchases: Number(todayPurchasesAgg._sum.total ?? 0),
        netProfit,
        revenueGrowth,
      }}
      recentSales={recentSales}
      recentPurchases={recentPurchases}
      lowStockMedicines={lowStock}
      expiringMedicines={expiringMedicines.map((row) => ({ ...row, productListing: row.listing }))}
      topSellingMedicines={topSellingMedicines}
      salesChartData={salesChartData}
      revenueChartData={revenueChartData}
      categoryChartData={categoryChartData}
    />
  );
}
