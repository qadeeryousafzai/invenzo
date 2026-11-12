import { redirect } from "next/navigation";
import { ShoppingBasket, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PurchaseReportsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("reports.view")) return <p className="surface-card p-8">Reports access unavailable for this role.</p>;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [thisMonth, lastMonth, recent, bySupplier, topItems, business] = await Promise.all([
    prisma.purchase.aggregate({ where: { businessId: context.businessId, purchasedAt: { gte: startOfMonth } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.purchase.aggregate({ where: { businessId: context.businessId, purchasedAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.purchase.findMany({ where: { businessId: context.businessId }, include: { supplier: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { purchasedAt: "desc" }, take: 10 }),
    prisma.purchase.groupBy({ by: ["supplierId"], where: { businessId: context.businessId }, _sum: { total: true }, _count: { _all: true }, orderBy: { _sum: { total: "desc" } }, take: 8 }),
    prisma.purchaseItem.groupBy({ by: ["productListingId"], where: { purchase: { businessId: context.businessId, purchasedAt: { gte: startOfMonth } } }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { lineTotal: "desc" } }, take: 5 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "PKR";
  const supplierIds = bySupplier.map((row) => row.supplierId).filter((id): id is string => !!id);
  const supplierNames = supplierIds.length ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } }) : [];
  const supplierMap = new Map(supplierNames.map((supplier) => [supplier.id, supplier.name]));

  const listingIds = topItems.map((row) => row.productListingId);
  const listings = listingIds.length ? await prisma.productListing.findMany({ where: { id: { in: listingIds } }, include: { product: { select: { name: true, sku: true } } } }) : [];
  const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

  const thisMonthTotal = Number(thisMonth._sum.total ?? 0);
  const lastMonthTotal = Number(lastMonth._sum.total ?? 0);
  const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Reports</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><ShoppingBasket className="h-5 w-5" /></span>Purchase Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Understand procurement spend, supplier distribution, and top purchased items.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">This month spend</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(thisMonthTotal)}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Purchase orders</p><p className="mt-2 text-2xl font-semibold text-slate-900">{thisMonth._count._all}</p><p className="mt-1 text-xs text-slate-500">This month</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-slate-500"><TrendingUp className="h-4 w-4" /><p className="text-xs font-medium">vs last month</p></div><p className={`mt-2 text-2xl font-semibold ${growth >= 0 ? "text-[#16a34a]" : "text-red-600"}`}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</p><p className="mt-1 text-xs text-slate-500">{money(lastMonthTotal)} last month</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Suppliers</p><p className="mt-2 text-2xl font-semibold text-slate-900">{bySupplier.filter((row) => row.supplierId).length}</p><p className="mt-1 text-xs text-slate-500">Active this period</p></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Spend by supplier</h2><p className="mt-1 text-xs text-slate-500">Ranked by total purchase value.</p></div>
          {bySupplier.length ? (
            <div className="divide-y divide-[#e5e7eb]">{bySupplier.map((row) => <div key={row.supplierId ?? "none"} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-medium text-slate-900">{row.supplierId ? supplierMap.get(row.supplierId) ?? "Unknown supplier" : "No supplier"}</p><p className="mt-1 text-xs text-slate-500">{row._count._all} purchase{row._count._all === 1 ? "" : "s"}</p></div><p className="font-semibold text-slate-900">{money(Number(row._sum.total ?? 0))}</p></div>)}</div>
          ) : <div className="p-10 text-center text-sm text-slate-500">No purchases recorded.</div>}
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Top purchased items</h2><p className="mt-1 text-xs text-slate-500">Best movers this month.</p></div>
          {topItems.length ? (
            <div className="divide-y divide-[#e5e7eb]">{topItems.map((row) => { const listing = listingMap.get(row.productListingId); return <div key={row.productListingId} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-medium text-slate-900">{listing?.product.name ?? "Archived product"}</p><p className="mt-1 text-xs text-slate-500">{listing?.product.sku ?? ""} · {Number(row._sum.quantity ?? 0)} units</p></div><p className="font-semibold text-slate-900">{money(Number(row._sum.lineTotal ?? 0))}</p></div>; })}</div>
          ) : <div className="p-10 text-center text-sm text-slate-500">No purchases this month.</div>}
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Recent purchase orders</h2></div>
        {recent.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Supplier</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Items</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Total</th></tr></thead><tbody className="divide-y divide-[#e5e7eb]">{recent.map((row) => <tr key={row.id} className="hover:bg-[#f8fafc]/70"><td className="px-5 py-4 font-medium text-slate-900">{row.reference}</td><td className="px-5 py-4 text-slate-600">{row.supplier?.name ?? "Unspecified"}</td><td className="px-5 py-4 text-slate-600">{row.branch.name}</td><td className="px-5 py-4 text-slate-600">{row._count.items}</td><td className="px-5 py-4 text-slate-600">{row.purchasedAt.toLocaleDateString()}</td><td className="px-5 py-4 text-right font-semibold text-slate-900">{money(Number(row.total))}</td></tr>)}</tbody></table></div>
        ) : <div className="p-10 text-center text-sm text-slate-500">No purchase orders yet.</div>}
      </section>
    </div>
  );
}