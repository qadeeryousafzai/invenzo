import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { TransactionManager } from "@/components/operations/transaction-manager";

export default async function SalesPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.view")) return <p className="surface-card p-8">Sales access unavailable for this role.</p>;
  const [branches, customers, listings, sales, business] = await Promise.all([
    prisma.branch.findMany({ where: { businessId: context.businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { businessId: context.businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.productListing.findMany({ where: { businessId: context.businessId, product: { deletedAt: null } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { id: true, name: true } } }, orderBy: { product: { name: "asc" } }, take: 1000 }),
    prisma.sale.findMany({ where: { businessId: context.businessId }, include: { customer: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { soldAt: "desc" }, take: 200 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);
  const rows = sales.map((row) => ({ id: row.id, reference: row.reference, contact: row.customer?.name ?? "Walk-in", branch: row.branch.name, total: row.total.toString(), date: row.soldAt.toISOString(), itemCount: row._count.items }));
  const catalog = listings.map((row) => ({ id: row.id, product: row.product.name, sku: row.product.sku, unit: row.product.unit, branchId: row.branch.id, branch: row.branch.name, price: Number(row.price) }));
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-black">SALES</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-black"><ShoppingCart className="text-black" />Sales</h1><p className="mt-2 text-sm text-gray-600">Post sales against current branch prices and keep inventory synchronized.</p></div><TransactionManager mode="sale" branches={branches} contacts={customers} listings={catalog} rows={rows} canCreate={context.permissions.has("sales.create")} currency={business?.currency ?? "PKR"} /></div>;
}
