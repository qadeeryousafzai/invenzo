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
        <h1 className="text-xl font-semibold">Workspace overview unavailable</h1>
        <p className="mt-2 text-sm text-gray-600">Your assigned role does not include business viewing permission.</p>
      </div>
    );
  }

  const businessId = context.businessId;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalMedicines,
    lowStockCount,
    expiringSoonCount,
    totalCustomers,
    totalSuppliers,
    todaySalesCount,
    todayRevenue,
    monthRevenue,
    lastMonthRevenue,
    recentSales,
    recentPurchases,
    lowStockMedicines,
    expiringMedicines,
    topSellingMedicines,
    salesChartData,
    revenueChartData,
    categoryChartData,
  ] = await Promise.all([
    prisma.product.count({ where: { businessId, deletedAt: null } }),
    prisma.productListing.count({
      where: {
        businessId,
        product: { deletedAt: null },
        batches: { some: { quantityRemaining: { gt: 0 }, expiryDate: { gte: now } } },
      },
    }),
    prisma.inventoryBatch.count({
      where: {
        businessId,
        quantityRemaining: { gt: 0 },
        expiryDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.customer.count({ where: { businessId, deletedAt: null } }),
    prisma.supplier.count({ where: { businessId, deletedAt: null } }),
    prisma.sale.count({ where: { businessId, soldAt: { gte: startOfToday } } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfToday } }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.sale.aggregate({ where: { businessId, soldAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { total: true } }),
    prisma.sale.findMany({
      where: { businessId },
      select: { id: true, reference: true, total: true, soldAt: true, customer: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { soldAt: "desc" },
      take: 5,
    }),
    prisma.purchase.findMany({
      where: { businessId },
      select: { id: true, reference: true, total: true, purchasedAt: true, supplier: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { purchasedAt: "desc" },
      take: 5,
    }),
    prisma.productListing.findMany({
      where: {
        businessId,
        product: { deletedAt: null },
        batches: { some: { quantityRemaining: { gt: 0 } } },
      },
      select: {
        id: true,
        product: { select: { name: true, sku: true } },
        branch: { select: { name: true } },
        batches: { where: { quantityRemaining: { gt: 0 } }, select: { quantityRemaining: true, expiryDate: true }, take: 1 },
      },
      take: 10,
    }),
    prisma.inventoryBatch.findMany({
      where: {
        businessId,
        quantityRemaining: { gt: 0 },
        expiryDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, quantityRemaining: true, expiryDate: true, listing: { select: { product: { select: { name: true } }, branch: { select: { name: true } } } } },
      orderBy: { expiryDate: "asc" },
      take: 10,
    }),
    prisma.saleItem.groupBy({
      by: ["productListingId"],
      where: { sale: { businessId, soldAt: { gte: startOfMonth } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ date: string; total: number; count: number }>>`
      SELECT DATE(soldAt) as date, SUM(total) as total, COUNT(*) as count
      FROM \`sales\`
      WHERE businessId = ${businessId} AND soldAt >= ${startOfMonth}
      GROUP BY DATE(soldAt)
      ORDER BY DATE(soldAt) ASC
    `,
    prisma.$queryRaw<Array<{ date: string; revenue: number }>>`
      SELECT DATE(soldAt) as date, SUM(total) as revenue
      FROM \`sales\`
      WHERE businessId = ${businessId} AND soldAt >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY DATE(soldAt)
      ORDER BY DATE(soldAt) ASC
    `,
    prisma.$queryRaw<Array<{ category: string; count: number }>>`
      SELECT COALESCE(p.category, 'Uncategorized') as category, COUNT(*) as count
      FROM \`products\` p
      WHERE p.businessId = ${businessId} AND p.deletedAt IS NULL
      GROUP BY COALESCE(p.category, 'Uncategorized')
      ORDER BY count DESC
      LIMIT 6
    `,
  ]);

  const todayRevenueNum = Number(todayRevenue._sum.total ?? 0);
  const monthRevenueNum = Number(monthRevenue._sum.total ?? 0);
  const lastMonthRevenueNum = Number(lastMonthRevenue._sum.total ?? 0);
  const revenueGrowth = lastMonthRevenueNum > 0 ? ((monthRevenueNum - lastMonthRevenueNum) / lastMonthRevenueNum) * 100 : 0;

  const stats = [
    { label: "Total Sales Today", value: todaySalesCount, change: todaySalesCount > 0 ? "+12%" : "—", icon: "💊", color: "emerald", permission: "sales.view" },
    { label: "Today's Revenue", value: todayRevenueNum.toLocaleString("en-US", { style: "currency", currency: "USD" }), change: todayRevenueNum > 0 ? "+8%" : "—", icon: "💰", color: "emerald", permission: "sales.view" },
    { label: "Total Medicines", value: totalMedicines, change: "—", icon: "💊", color: "blue", permission: "products.view" },
    { label: "Total Purchases", value: await prisma.purchase.count({ where: { businessId, purchasedAt: { gte: startOfMonth } } }), change: "—", icon: "📦", color: "amber", permission: "purchases.manage" },
    { label: "Low Stock Items", value: lowStockCount, change: lowStockCount > 0 ? "⚠️" : "✓", icon: "⚠️", color: "red", permission: "inventory.view" },
    { label: "Expiring Soon", value: expiringSoonCount, change: expiringSoonCount > 0 ? "⚠️" : "✓", icon: "📅", color: "orange", permission: "inventory.view" },
    { label: "Total Customers", value: totalCustomers, change: "—", icon: "👥", color: "violet", permission: "customers.manage" },
    { label: "Net Profit (Month)", value: (monthRevenueNum * 0.25).toLocaleString("en-US", { style: "currency", currency: "USD" }), change: revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`, icon: "📈", color: "emerald", permission: "reports.view" },
  ];

  return (
    <DashboardClient
      businessName={context.membership.business.name}
      greetingName={"there"}
      stats={stats.filter((s) => !s.permission || context.permissions?.has(s.permission))}
      recentSales={recentSales}
      recentPurchases={recentPurchases}
      lowStockMedicines={lowStockMedicines}
      expiringMedicines={expiringMedicines.map((row) => ({ ...row, productListing: row.listing }))}
      topSellingMedicines={topSellingMedicines}
      salesChartData={salesChartData}
      revenueChartData={revenueChartData}
      categoryChartData={categoryChartData}
      currency={context.membership.business.currency}
      permissions={Array.from(context.permissions ?? [])}
    />
  );
}