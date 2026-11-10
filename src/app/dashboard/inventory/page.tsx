import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { InventoryManager } from "@/components/operations/inventory-manager";

export default async function InventoryPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8 text-slate-700">Inventory access unavailable for this role.</p>;
  const [listings, movements] = await Promise.all([
    prisma.productListing.findMany({ where: { businessId: context.businessId, product: { deletedAt: null } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } }, batches: { where: { archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] }, select: { quantityRemaining: true } } }, orderBy: { product: { name: "asc" } }, take: 1000 }),
    prisma.stockMovement.findMany({ where: { businessId: context.businessId }, include: { listing: { include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } }, batch: { select: { batchNumber: true } }, actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 }),
  ]);
  const stock = listings.map(({ batches, ...listing }) => ({ id: listing.id, name: listing.product.name, sku: listing.product.sku, unit: listing.product.unit, branch: listing.branch.name, quantity: Number(batches.reduce((sum, batch) => sum + batch.quantityRemaining.toNumber(), 0).toFixed(3)) }));
  const history = movements.map((row) => ({ id: row.id, product: row.listing.product.name, sku: row.listing.product.sku, branch: row.listing.branch.name, batch: row.batch?.batchNumber ?? "", type: row.type, quantityChange: row.quantityChange.toString(), reference: row.reference ?? "", note: row.note ?? "", createdAt: row.createdAt.toISOString(), actor: row.actor?.name ?? row.actor?.email ?? "System" }));
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Stock Control</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Boxes className="h-5 w-5" /></span>Inventory</h1>
        <p className="mt-2 text-sm text-slate-500">Review available stock by branch and trace every stock movement from live records.</p>
      </div>
      <InventoryManager listings={stock} movements={history} canAdjust={context.permissions.has("inventory.adjust")} />
    </div>
  );
}
