import { redirect } from "next/navigation";
import { UserRound, TrendingUp, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function CustomerReportsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("reports.view")) return <p className="surface-card p-8">Reports access unavailable for this role.</p>;

  const [customers, saleStats, recent, business] = await Promise.all([
    prisma.customer.count({ where: { businessId: context.businessId, deletedAt: null } }),
    prisma.sale.groupBy({ by: ["customerId"], where: { businessId: context.businessId, customerId: { not: null } }, _sum: { total: true }, _count: { _all: true }, orderBy: { _sum: { total: "desc" } }, take: 10 }),
    prisma.sale.findMany({ where: { businessId: context.businessId }, include: { customer: { select: { name: true } } }, orderBy: { soldAt: "desc" }, take: 10 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "USD";
  const customerIds = saleStats.map((row) => row.customerId).filter((id): id is string => !!id);
  const customerRecords = customerIds.length ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, phone: true, email: true } }) : [];
  const customerMap = new Map(customerRecords.map((customer) => [customer.id, customer]));

  const totalRevenue = saleStats.reduce((sum, row) => sum + Number(row._sum.total ?? 0), 0);
  const walkInCount = await prisma.sale.count({ where: { businessId: context.businessId, customerId: null } });
  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const topCustomer = saleStats[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Reports</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><UserRound className="h-5 w-5" /></span>Customer Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Understand customer purchasing behaviour and top accounts.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Registered customers</p><p className="mt-2 text-2xl font-semibold text-slate-900">{customers}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Customers with sales</p><p className="mt-2 text-2xl font-semibold text-slate-900">{saleStats.length}</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-[#16a34a]"><TrendingUp className="h-4 w-4" /><p className="text-xs font-medium">Revenue from customers</p></div><p className="mt-2 text-2xl font-semibold text-[#16a34a]">{money(totalRevenue)}</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-[#b45309]"><Trophy className="h-4 w-4" /><p className="text-xs font-medium">Walk-in sales</p></div><p className="mt-2 text-2xl font-semibold text-slate-900">{walkInCount}</p></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Top customers</h2><p className="mt-1 text-xs text-slate-500">Ranked by total purchase value.</p></div>
          {saleStats.length ? (
            <div className="divide-y divide-[#e5e7eb]">{saleStats.map((row, index) => { const customer = row.customerId ? customerMap.get(row.customerId) : null; return <div key={row.customerId ?? "walkin"} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f7ee] text-xs font-bold text-[#003d32]">#{index + 1}</span><div className="min-w-0"><p className="truncate font-medium text-slate-900">{customer?.name ?? "Unknown customer"}</p><p className="mt-1 text-xs text-slate-500">{customer?.phone ?? customer?.email ?? "—"} · {row._count._all} sale{row._count._all === 1 ? "" : "s"}</p></div></div><p className="font-semibold text-slate-900">{money(Number(row._sum.total ?? 0))}</p></div>; })}</div>
          ) : <div className="p-10 text-center text-sm text-slate-500">No customer-linked sales yet.</div>}
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Recent customer sales</h2></div>
          {recent.length ? (
            <div className="divide-y divide-[#e5e7eb]">{recent.map((sale) => <div key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-medium text-slate-900">{sale.customer?.name ?? "Walk-in customer"}</p><p className="mt-1 text-xs text-slate-500">{sale.reference} · {sale.soldAt.toLocaleDateString()}</p></div><p className="font-semibold text-slate-900">{money(Number(sale.total))}</p></div>)}</div>
          ) : <div className="p-10 text-center text-sm text-slate-500">No sales recorded.</div>}
        </section>
      </div>

      {topCustomer && (
        <section className="surface-card flex flex-wrap items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Trophy className="h-6 w-6" /></span>
          <div><p className="text-xs font-medium text-slate-500">Top customer</p><p className="mt-1 text-lg font-semibold text-slate-900">{topCustomer.customerId ? customerMap.get(topCustomer.customerId)?.name ?? "Unknown customer" : "Walk-in customer"}</p></div>
          <div className="ml-auto text-right"><p className="text-xs font-medium text-slate-500">Total value</p><p className="mt-1 text-lg font-semibold text-[#16a34a]">{money(Number(topCustomer._sum.total ?? 0))}</p></div>
        </section>
      )}
    </div>
  );
}