import { redirect } from "next/navigation";
import { Pill } from "lucide-react";
import { ProductManager } from "@/components/products/product-manager";
import { getTenantContext } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("products.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-slate-900">Medicine access unavailable</h1><p className="mt-2 text-sm text-slate-500">Your role does not include product viewing permission.</p></div>;
  }

  const [branches, categories, products] = await Promise.all([
    prisma.branch.findMany({ where: { businessId: context.businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { businessId: context.businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { businessId: context.businessId, deletedAt: null },
      select: {
        id: true, name: true, sku: true, category: true, categoryRef: { select: { name: true } }, unit: true,
        listings: {
          where: { businessId: context.businessId },
          select: {
            id: true, price: true, marketplaceEnabled: true,
            branch: { select: { name: true } },
            batches: { where: { archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] }, select: { quantityRemaining: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  const rows = products.map(({ listings, categoryRef, ...product }) => ({
    ...product,
    category: categoryRef?.name ?? product.category,
    listings: listings.map(({ batches, ...listing }) => ({
      ...listing,
      price: listing.price.toString(),
      remainingQuantity: batches.reduce((total, batch) => total + Number(batch.quantityRemaining), 0),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Inventory</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Pill className="h-5 w-5" /></span>
          All Medicines
        </h1>
        <p className="mt-2 text-sm text-slate-500">Manage your medicine catalog, pricing, branch listings, and opening stock batches for this pharmacy.</p>
      </div>
      <ProductManager branches={branches} categories={categories} products={rows} canCreate={context.permissions.has("products.create") && context.permissions.has("inventory.adjust")} />
    </div>
  );
}
