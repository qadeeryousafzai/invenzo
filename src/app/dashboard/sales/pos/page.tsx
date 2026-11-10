import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { PosClient } from "@/components/operations/pos-client";

export default async function PosPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.create")) {
    return <p className="surface-card p-8">Point of Sale access unavailable for this role.</p>;
  }
  const businessId = context.businessId;
  const now = new Date();
  const [branches, customers, listings, categories, business] = await Promise.all([
    prisma.branch.findMany({ where: { businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { businessId, deletedAt: null }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.productListing.findMany({
      where: { businessId, product: { deletedAt: null } },
      include: {
        product: { select: { id: true, name: true, sku: true, barcode: true, brand: true, category: true, unit: true, imageUrl: true, description: true, categoryRef: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
        batches: {
          where: { archivedAt: null, quantityRemaining: { gt: 0 }, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
          select: { quantityRemaining: true, expiryDate: true },
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
    imageUrl: row.product.imageUrl ?? "",
    description: row.product.description ?? "",
    branchId: row.branch.id,
    branchName: row.branch.name,
    price: Number(row.price),
    availableStock: Number(row.batches.reduce((sum, b) => sum + b.quantityRemaining.toNumber(), 0).toFixed(3)),
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-black">SALES</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-black"><CreditCard className="text-black" />Point of Sale</h1>
        <p className="mt-2 text-sm text-gray-600">Search medicines, build an order, and complete sales with automatic inventory updates.</p>
      </div>
      <PosClient
        branches={branches}
        customers={customers}
        catalog={catalog}
        categories={categories.map((c) => c.name)}
        currency={business?.currency ?? "USD"}
        business={{ name: business?.name ?? context.membership.business.name, address: business?.address ?? "", phone: business?.phone ?? "" }}
        canCreateCustomer={context.permissions.has("customers.manage")}
      />
    </div>
  );
}
