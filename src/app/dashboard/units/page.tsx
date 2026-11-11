import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function UnitsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("products.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Unit access unavailable</h1><p className="mt-2 text-sm text-[#77847d]">Your role does not include product viewing permission.</p></div>;
  }

  const products = await prisma.product.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    select: { unit: true, id: true, name: true, sku: true },
    orderBy: { name: "asc" },
    take: 1000,
  });

  const unitMap = new Map<string, { name: string; productCount: number; products: { id: string; name: string; sku: string }[] }>();
  products.forEach((p) => {
    const unit = p.unit || "unit";
    const existing = unitMap.get(unit);
    if (existing) {
      existing.productCount += 1;
      existing.products.push({ id: p.id, name: p.name, sku: p.sku });
    } else {
      unitMap.set(unit, { name: unit, productCount: 1, products: [{ id: p.id, name: p.name, sku: p.sku }] });
    }
  });

  const rows = Array.from(unitMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Catalog</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Layers className="h-5 w-5" /></span>
          Units
        </h1>
        <p className="mt-2 text-sm text-[#77847d]">Manage units of measure for your products. Units are derived from your product catalog.</p>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e8eee8] px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#17231f]">All units</h2>
            <p className="mt-1 text-xs text-[#77847d]">{rows.length} unit{rows.length === 1 ? "" : "s"} across your product catalog.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8eee8] bg-[#f1f7ee] px-3 py-1 text-xs font-medium text-[#77847d]">{rows.length} results</span>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Unit</th>
                  <th className="px-5 py-3 font-semibold">Products</th>
                  <th className="px-5 py-3 font-semibold">Sample products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {rows.map((unit) => (
                  <tr key={unit.name} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#17231f]">{unit.name}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{unit.productCount}</td>
                    <td className="px-5 py-4 text-[#77847d]">
                      {unit.products.slice(0, 3).map((p) => (
                        <div key={p.id} className="text-xs truncate max-w-[200px]">{p.name} <span className="text-slate-400">({p.sku})</span></div>
                      ))}
                      {unit.products.length > 3 && <span className="text-xs text-[#77847d]">+{unit.products.length - 3} more</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Layers className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No units found</p>
            <p className="mt-2 text-sm text-[#77847d]">Add products with a unit to start tracking them here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
