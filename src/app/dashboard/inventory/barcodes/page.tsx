import { redirect } from "next/navigation";
import { Barcode, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function BarcodesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8 text-slate-700">Barcode access unavailable for this role.</p>;

  const products = await prisma.product.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    select: { id: true, name: true, sku: true, barcode: true, brand: true, category: true, unit: true },
    orderBy: { name: "asc" },
    take: 1000,
  });

  const withBarcode = products.filter((product) => product.barcode);
  const withoutBarcode = products.filter((product) => !product.barcode);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Inventory</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Barcode className="h-5 w-5" /></span>Barcode Management</h1>
        <p className="mt-2 text-sm text-slate-500">Review product SKUs and barcodes for point-of-sale scanning.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Total products</p><p className="mt-2 text-2xl font-semibold text-slate-900">{products.length}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">With barcode</p><p className="mt-2 text-2xl font-semibold text-[#16a34a]">{withBarcode.length}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Missing barcode</p><p className="mt-2 text-2xl font-semibold text-amber-600">{withoutBarcode.length}</p><p className="mt-1 text-xs text-slate-500">Scanning unavailable</p></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-5 py-4"><Search className="h-4 w-4 text-slate-400" /><h2 className="font-semibold text-slate-900">Product codes</h2><span className="ml-auto text-xs text-slate-500">{products.length} product{products.length === 1 ? "" : "s"}</span></div>
        {products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Product</th><th className="px-5 py-3 font-semibold">SKU</th><th className="px-5 py-3 font-semibold">Barcode</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Unit</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4"><p className="font-medium text-slate-900">{product.name}</p>{product.brand && <p className="text-xs text-slate-500">{product.brand}</p>}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">{product.sku}</td>
                    <td className="px-5 py-4">{product.barcode ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f7ee] px-2 py-1 font-mono text-xs text-[#003d32]"><Barcode className="h-3.5 w-3.5" />{product.barcode}</span> : <span className="text-xs text-slate-400">No barcode</span>}</td>
                    <td className="px-5 py-4 text-slate-600">{product.category ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{product.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><Barcode className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No products yet</p><p className="mt-2 text-sm text-slate-500">Add products to manage SKUs and barcodes.</p></div>
        )}
      </section>
    </div>
  );
}