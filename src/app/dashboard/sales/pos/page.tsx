import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { PosClient } from "@/components/operations/pos-client";

export default async function PosPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.create")) {
    return <div className="surface-card p-8 text-slate-700">Point of Sale access unavailable for this role.</div>;
  }
  const businessId = context.businessId;
  const now = new Date();
  const [branches, customers, listings, categories, business] = await Promise.all([
    prisma.branch.findMany({ where: { businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { businessId, deletedAt: null }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.productListing.findMany({
      where: { businessId, product: { deletedAt: null } },
      include: {
        product: { select: { id: true, name: true, sku: true, barcode: true, brand: true, category: true, unit: true, packSize: true, packUnit: true, imageUrl: true, description: true, categoryRef: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
        batches: {
          where: { archivedAt: null, quantityRemaining: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
          select: { quantityRemaining: true },
        },
      },
      orderBy: { product: { name: "asc" } },
      take: 2000,
    }),
    prisma.category.findMany({ where: { businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true, currency: true, address: true, phone: true } }),
  ]);

  const catalog = listings.map((row) => ({
    id: row.id,
    productId: row.product.id,
    name: row.product.name,
    sku: row.product.sku,
    barcode: row.product.barcode ?? "",
    brand: row.product.brand ?? "",
    category: row.product.categoryRef?.name ?? row.product.category ?? "Uncategorized",
    unit: row.product.unit,
    strength: row.product.description ?? "",
    imageUrl: row.product.imageUrl ?? "",
    branchId: row.branch.id,
    branchName: row.branch.name,
    price: Number(row.price),
    availableStock: Number(row.batches.reduce((sum, b) => sum + b.quantityRemaining.toNumber(), 0).toFixed(3)),
    packSize: row.product.packSize > 1 ? row.product.packSize : 1,
    packUnit: row.product.packUnit ?? null,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Sales</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><CreditCard className="h-5 w-5" /></span>
            Point of Sale
          </h1>
          <p className="mt-2 text-sm text-slate-500">Search medicines, build the cart, validate stock, and complete payment with automatic inventory updates.</p>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span className="font-medium text-slate-900">{branches.length}</span> active branch{branches.length === 1 ? "" : "es"} · <span className="font-medium text-slate-900">{catalog.length}</span> listed medicines
        </div>
      </div>
      <PosClient
        branches={branches}
        customers={customers}
        catalog={catalog}
        categories={categories.map((c) => c.name)}
        currency={business?.currency ?? context.membership.business.currency ?? "PKR"}
        business={{ name: business?.name ?? context.membership.business.name, address: business?.address ?? "", phone: business?.phone ?? "" }}
        canCreateCustomer={context.permissions.has("customers.manage")}
      />
    </div>
  );
}
