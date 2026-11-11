import { redirect } from "next/navigation";
import { Package, AlertTriangle, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function BatchesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8 text-slate-700">Batch access unavailable for this role.</p>;

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const batches = await prisma.inventoryBatch.findMany({
    where: { businessId: context.businessId, archivedAt: null },
    include: { listing: { include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } } } },
    orderBy: [{ expiryDate: "asc" }, { receivedAt: "desc" }],
    take: 500,
  });

  const totalUnits = batches.reduce((sum, batch) => sum + Number(batch.quantityRemaining), 0);
  const expired = batches.filter((batch) => batch.expiryDate && batch.expiryDate < now);
  const nearExpiry = batches.filter((batch) => batch.expiryDate && batch.expiryDate >= now && batch.expiryDate <= soon);
  const inStock = batches.filter((batch) => Number(batch.quantityRemaining) > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Inventory</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Package className="h-5 w-5" /></span>Batches</h1>
        <p className="mt-2 text-sm text-slate-500">Review every stock batch with its quantity, expiry, and source branch.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Total batches</p><p className="mt-2 text-2xl font-semibold text-slate-900">{batches.length}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Units in stock</p><p className="mt-2 text-2xl font-semibold text-slate-900">{totalUnits.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">Across {inStock.length} active batch{inStock.length === 1 ? "" : "es"}</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-amber-600"><CalendarClock className="h-4 w-4" /><p className="text-xs font-medium">Expiring soon</p></div><p className="mt-2 text-2xl font-semibold text-amber-600">{nearExpiry.length}</p><p className="mt-1 text-xs text-slate-500">Within 30 days</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-4 w-4" /><p className="text-xs font-medium">Expired</p></div><p className="mt-2 text-2xl font-semibold text-red-600">{expired.length}</p><p className="mt-1 text-xs text-slate-500">Past expiry date</p></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Batch list</h2><p className="mt-1 text-xs text-slate-500">Ordered by expiry date, then most recently received.</p></div>
        {batches.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Medicine</th><th className="px-5 py-3 font-semibold">Batch no.</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Quantity</th><th className="px-5 py-3 font-semibold">Received</th><th className="px-5 py-3 font-semibold">Expiry</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {batches.map((batch) => {
                  const status = batch.expiryDate && batch.expiryDate < now ? "expired" : batch.expiryDate && batch.expiryDate <= soon ? "near" : Number(batch.quantityRemaining) <= 0 ? "empty" : "ok";
                  return (
                    <tr key={batch.id} className="hover:bg-[#f8fafc]/70">
                      <td className="px-5 py-4"><p className="font-medium text-slate-900">{batch.listing.product.name}</p><p className="text-xs text-slate-500">{batch.listing.product.sku}</p></td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{batch.batchNumber}</td>
                      <td className="px-5 py-4 text-slate-600">{batch.listing.branch.name}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{Number(batch.quantityRemaining).toLocaleString()} {batch.listing.product.unit}</td>
                      <td className="px-5 py-4 text-slate-600">{new Date(batch.receivedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-slate-600">{batch.expiryDate ? batch.expiryDate.toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "expired" ? "bg-red-50 text-red-700" : status === "near" ? "bg-amber-50 text-amber-700" : status === "empty" ? "bg-slate-100 text-slate-500" : "bg-[#f1fce0] text-[#003d32]"}`}>{status === "expired" ? "Expired" : status === "near" ? "Expiring soon" : status === "empty" ? "Depleted" : "In stock"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><Package className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No batches recorded</p><p className="mt-2 text-sm text-slate-500">Receive purchase stock to create batches.</p></div>
        )}
      </section>
    </div>
  );
}