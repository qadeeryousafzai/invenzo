import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { PrintButton } from "@/components/operations/print-button";

export default async function InvoicesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.view")) return <p className="surface-card p-8">Sales access unavailable for this role.</p>;

  const [sales, business] = await Promise.all([
    prisma.sale.findMany({ where: { businessId: context.businessId }, include: { customer: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { soldAt: "desc" }, take: 200 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true, name: true } }),
  ]);

  const currency = business?.currency ?? "PKR";
  const totalInvoiced = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Sales</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><FileText className="h-5 w-5" /></span>Invoices</h1>
          <p className="mt-2 text-sm text-slate-500">Every completed sale generates a printable invoice. Review them all here.</p>
        </div>
        <Link href="/dashboard/sales/pos" className="button-primary"><Printer className="h-4 w-4" /> New sale</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Invoices</p><p className="mt-2 text-2xl font-semibold text-slate-900">{sales.length}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Total invoiced</p><p className="mt-2 text-2xl font-semibold text-[#16a34a]">{money(totalInvoiced)}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Business</p><p className="mt-2 text-lg font-semibold text-slate-900">{business?.name ?? "—"}</p></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Invoice list</h2><p className="mt-1 text-xs text-slate-500">{sales.length} invoice{sales.length === 1 ? "" : "s"}, newest first.</p></div>
        {sales.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Invoice / Reference</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Items</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Total</th><th className="px-5 py-3" /></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{sale.reference}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.customer?.name ?? "Walk-in"}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.branch.name}</td>
                    <td className="px-5 py-4 text-slate-600">{sale._count.items}</td>
                    <td className="px-5 py-4 text-slate-600">{sale.soldAt.toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{money(Number(sale.total))}</td>
                    <td className="px-5 py-4 text-right"><PrintButton /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><FileText className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No invoices yet</p><p className="mt-2 text-sm text-slate-500">Complete a POS sale to generate an invoice.</p></div>
        )}
      </section>
    </div>
  );
}