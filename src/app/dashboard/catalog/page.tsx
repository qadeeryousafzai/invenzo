import { redirect } from "next/navigation";
import { Globe2 } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { getTenantContext } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Medicine Catalog" };

export default async function CatalogPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("products.view")) {
    return (
      <div className="surface-card p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Catalog access unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">Your role does not include product viewing permission.</p>
      </div>
    );
  }

  const branches = await prisma.branch.findMany({
    where: { businessId: context.businessId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const [medicineCount, stockedCount] = await Promise.all([
    prisma.medicine.count(),
    prisma.productListing.count({ where: { businessId: context.businessId, product: { deletedAt: null } } }),
  ]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <Globe2 size={18} /> Global Medicine Catalog
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
            Every medicine from the global catalog is listed here with its stock — zero until you add it. You already carry{" "}
            {new Intl.NumberFormat("en-US").format(stockedCount)} of the {new Intl.NumberFormat("en-US").format(medicineCount)}{" "}
            catalog medicines; add stock to those, or bring a new one into your inventory.
          </p>
        </div>
      </header>

      <CatalogBrowser branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))} />
    </div>
  );
}