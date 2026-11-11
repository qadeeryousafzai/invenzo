import { redirect } from "next/navigation";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PurchaseReturnsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("purchases.manage")) return <p className="surface-card p-8">Purchase access unavailable for this role.</p>;

  const [recentPurchases, business] = await Promise.all([
    prisma.purchase.findMany({ where: { businessId: context.businessId }, include: { supplier: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { purchasedAt: "desc" }, take: 15 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "USD";
  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Purchases</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><RotateCcw className="h-5 w-5" /></span>Purchase Returns</h1>
        <p className="mt-2 text-sm text-slate-500">Review received purchases that may be eligible for supplier return.</p>
      </div>

      <section className="surface-card p-6">
        <h2 className="font-semibold text-slate-900">Return handling</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Purchase return workflows are not yet implemented as a separate module. Purchases and stock movement history are active. Use the records below to reference a purchase when processing a manual supplier return and adjusting inventory.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/purchases" className="button-secondary">Purchase orders <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/inventory/adjustments" className="button-primary">Adjust stock</Link>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Recent purchases (return candidates)</h2><p className="mt-1 text-xs text-slate-500">Most recent purchases, newest first.</p></div>
        {recentPurchases.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Supplier</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Items</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{purchase.reference}</td>
                    <td className="px-5 py-4 text-slate-600">{purchase.supplier?.name ?? "Unspecified"}</td>
                    <td className="px-5 py-4 text-slate-600">{purchase.branch.name}</td>
                    <td className="px-5 py-4 text-slate-600">{purchase._count.items}</td>
                    <td className="px-5 py-4 text-slate-600">{purchase.purchasedAt.toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{money(Number(purchase.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><RotateCcw className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No purchases yet</p><p className="mt-2 text-sm text-slate-500">Received purchases will appear here.</p></div>
        )}
      </section>
    </div>
  );
}