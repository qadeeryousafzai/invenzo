import { redirect } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { TransactionManager } from "@/components/operations/transaction-manager";

export default async function PurchasesPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("purchases.manage")) return <p className="surface-card p-8">Purchase access unavailable for this role.</p>;
  const [branches, suppliers, listings, purchases, business] = await Promise.all([
    prisma.branch.findMany({ where: { businessId: context.businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { businessId: context.businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.productListing.findMany({ where: { businessId: context.businessId, product: { deletedAt: null } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { id: true, name: true } } }, orderBy: { product: { name: "asc" } }, take: 1000 }),
    prisma.purchase.findMany({ where: { businessId: context.businessId }, include: { supplier: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { purchasedAt: "desc" }, take: 200 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);
  const rows = purchases.map((row) => ({ id: row.id, reference: row.reference, contact: row.supplier?.name ?? "Unspecified", branch: row.branch.name, total: row.total.toString(), date: row.purchasedAt.toISOString(), itemCount: row._count.items }));
  const catalog = listings.map((row) => ({ id: row.id, product: row.product.name, sku: row.product.sku, unit: row.product.unit, branchId: row.branch.id, branch: row.branch.name, price: Number(row.price) }));
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">PROCUREMENT</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><ShoppingBasket className="text-emerald-800" />Purchases</h1><p className="mt-2 text-sm text-slate-500">Receive goods from suppliers and track purchase costs by batch.</p></div><TransactionManager mode="purchase" branches={branches} contacts={suppliers} listings={catalog} rows={rows} canCreate={true} currency={business?.currency ?? "USD"} /></div>;
}
