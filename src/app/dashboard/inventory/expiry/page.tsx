import { redirect } from "next/navigation";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

type BatchRow = {
  id: string;
  batchNumber: string;
  quantityRemaining: unknown;
  expiryDate: Date | null;
  listing: { product: { name: string; sku: string }; branch: { name: string } };
};

function ExpiryTable({ rows, title, description, tone }: { rows: BatchRow[]; title: string; description: string; tone: "danger" | "warn" }) {
  return (

    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
        <div><h2 className="flex items-center gap-2 font-semibold text-slate-900">{tone === "danger" ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CalendarClock className="h-4 w-4 text-amber-500" />}{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone === "danger" ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"}`}>{rows.length} batch{rows.length === 1 ? "" : "es"}</span>
      </div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Medicine", "SKU", "Branch", "Batch", "Quantity", "Expiry date"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#e5e7eb]">{rows.map((row) => <tr key={row.id} className="hover:bg-[#f8fafc]/70"><td className="px-5 py-4 font-medium text-slate-900">{row.listing.product.name}</td><td className="px-5 py-4 text-slate-600">{row.listing.product.sku}</td><td className="px-5 py-4 text-slate-600">{row.listing.branch.name}</td><td className="px-5 py-4 text-slate-600">{row.batchNumber}</td><td className="px-5 py-4 font-medium text-slate-800">{Number(row.quantityRemaining)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone === "danger" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{row.expiryDate ? row.expiryDate.toLocaleDateString() : "—"}</span></td></tr>)}</tbody></table></div> : <div className="p-10 text-center text-sm text-slate-500">No batches in this category.</div>}
    </section>
  );
}

export default async function ExpiryManagementPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8 text-slate-700">Expiry management unavailable for this role.</p>;
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [expired, nearExpiry] = await Promise.all([
    prisma.inventoryBatch.findMany({ where: { businessId: context.businessId, quantityRemaining: { gt: 0 }, archivedAt: null, expiryDate: { lt: now } }, include: { listing: { include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } } }, orderBy: { expiryDate: "asc" }, take: 200 }),
    prisma.inventoryBatch.findMany({ where: { businessId: context.businessId, quantityRemaining: { gt: 0 }, archivedAt: null, expiryDate: { gte: now, lte: soon } }, include: { listing: { include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } } }, orderBy: { expiryDate: "asc" }, take: 200 }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Inventory</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><AlertTriangle className="h-5 w-5" /></span>Expiry Management</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor expired and near-expiry medicine batches from live inventory records.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-4"><p className="text-sm text-slate-500">Expired batches</p><p className="mt-2 text-2xl font-semibold text-red-600">{expired.length}</p></div>
        <div className="surface-card p-4"><p className="text-sm text-slate-500">Expiring in 30 days</p><p className="mt-2 text-2xl font-semibold text-amber-600">{nearExpiry.length}</p></div>
        <div className="surface-card p-4"><p className="text-sm text-slate-500">Total flagged units</p><p className="mt-2 text-2xl font-semibold text-slate-900">{[...expired, ...nearExpiry].reduce((s, r) => s + Number(r.quantityRemaining), 0)}</p></div>
      </div>
      <ExpiryTable rows={expired} title="Expired batches" description="Batches past expiry date with remaining quantity." tone="danger" />
      <ExpiryTable rows={nearExpiry} title="Expiring soon" description="Batches expiring within the next 30 days." tone="warn" />
    </div>
  );
}
