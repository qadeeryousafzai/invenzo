import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { ProductManager } from "@/components/products/product-manager";
import { getTenantContext } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("products.view")) return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold">Product access unavailable</h1><p className="mt-2 text-sm text-slate-500">Your role does not include product viewing permission.</p></div>;

  const [branches, categories, products] = await Promise.all([
    prisma.branch.findMany({ where: { businessId: context.businessId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { businessId: context.businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { businessId: context.businessId, deletedAt: null },
      select: {
        id: true, name: true, sku: true, category: true, categoryRef: { select: { name: true } }, unit: true,
        listings: {
          where: { businessId: context.businessId },
          select: { id: true, price: true, marketplaceEnabled: true, branch: { select: { name: true } }, batches: { where: { archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] }, select: { quantityRemaining: true, expiryDate: true } } },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
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

  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">PRODUCT CATALOG</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><PackageSearch size={27} className="text-emerald-800" />Products</h1><p className="mt-2 text-sm text-slate-500">Manage product details, opening stock batches, branch pricing, and public visibility.</p></div><ProductManager branches={branches} categories={categories} products={rows} canCreate={context.permissions.has("products.create") && context.permissions.has("inventory.adjust")} /></div>;
}
