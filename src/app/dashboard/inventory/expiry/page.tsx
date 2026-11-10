import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function ExpiryManagementPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8">Expiry management unavailable for this role.</p>;
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [expired, nearExpiry] = await Promise.all([
    prisma.inventoryBatch.findMany({ where: { businessId: context.businessId, quantityRemaining: { gt: 0 }, expiryDate: { lt: now } }, include: { listing: { include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } } }, orderBy: { expiryDate: "asc" }, take: 200 }),
    prisma.inventoryBatch.findMany({ where: { businessId: context.businessId, quantityRemaining: { gt: 0 }, expiryDate: { gte: now, lte: soon } }, include: { listing: { include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } } }, orderBy: { expiryDate: "asc" }, take: 200 }),
  ]);
  const Table = ({ rows, title, tone }: { rows: typeof nearExpiry; title: string; tone: string }) => (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-black">{title}</h2><p className="mt-1 text-xs text-gray-600">{rows.length} batch{rows.length === 1 ? "" : "es"}.</p></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500"><tr>{["Medicine", "SKU", "Branch", "Batch", "Quantity", "Expiry"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-medium text-black">{row.listing.product.name}</td><td className="px-5 py-4 text-gray-600">{row.listing.product.sku}</td><td className="px-5 py-4 text-gray-600">{row.listing.branch.name}</td><td className="px-5 py-4 text-gray-600">{row.batchNumber}</td><td className="px-5 py-4 text-gray-700">{Number(row.quantityRemaining)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{row.expiryDate ? row.expiryDate.toLocaleDateString() : "—"}</span></td></tr>)}</tbody></table></div> : <div className="p-8 text-sm text-gray-600">No batches in this category.</div>}
    </section>
  );
  return <div className="space-y-6"><div><p className="text-xs font-bold tracking-[.15em] text-black">INVENTORY</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-black"><AlertTriangle className="text-black" />Expiry Management</h1><p className="mt-2 text-sm text-gray-600">Monitor expired and near-expiry medicine batches using live inventory data.</p></div><Table rows={expired} title="Expired batches" tone="bg-gray-100 text-black" /><Table rows={nearExpiry} title="Expiring in 30 days" tone="bg-gray-100 text-black" /></div>;
}
