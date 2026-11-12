import { redirect } from "next/navigation";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function SalesReturnsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.view")) return <p className="surface-card p-8">Sales access unavailable for this role.</p>;

  const [recentSales, business] = await Promise.all([
    prisma.sale.findMany({ where: { businessId: context.businessId }, include: { customer: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { soldAt: "desc" }, take: 15 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "PKR";
  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Sales</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><RotateCcw className="h-5 w-5" /></span>Sales Returns</h1>
        <p className="mt-2 text-sm text-slate-500">Review completed sales that may be eligible for return and restock.</p>
      </div>

      <section className="surface-card p-6">
        <h2 className="font-semibold text-slate-900">Return handling</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Sales return workflows are not yet implemented as a separate ledger. POS sales and stock deductions are active. Use the records below to reference a sale when processing a manual return and restocking inventory.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/sales" className="button-secondary">All sales <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/inventory/adjustments" className="button-primary">Adjust stock</Link>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Recent sales (return candidates)</h2><p className="mt-1 text-xs text-slate-500">Most recent sales, newest first.</p></div>
        {recentSales.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Items</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{sale.reference}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.customer?.name ?? "Walk-in"}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.branch.name}</td>
                    <td className="px-5 py-4 text-slate-600">{sale._count.items}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.soldAt.toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{money(Number(sale.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><RotateCcw className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No sales yet</p><p className="mt-2 text-sm text-slate-500">Completed sales will appear here.</p></div>
        )}
      </section>
    </div>
  );
}