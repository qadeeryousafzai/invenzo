import { redirect } from "next/navigation";
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  OPENING: { label: "Opening", icon: ArrowDownToLine, tone: "bg-[#eef6ff] text-[#1d4ed8]" },
  PURCHASE: { label: "Purchase", icon: ArrowDownToLine, tone: "bg-[#f3e8ff] text-[#7c3aed]" },
  SALE: { label: "Sale", icon: ArrowUpFromLine, tone: "bg-[#f1fce0] text-[#003d32]" },
  ADJUSTMENT: { label: "Adjustment", icon: SlidersHorizontal, tone: "bg-[#fff4e6] text-[#b45309]" },
  RETURN: { label: "Return", icon: RotateCcw, tone: "bg-[#fce7f3] text-[#9d174d]" },
};

export default async function StockTransfersPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("inventory.view")) return <p className="surface-card p-8 text-slate-700">Stock movement access unavailable for this role.</p>;

  const movements = await prisma.stockMovement.findMany({
    where: { businessId: context.businessId },
    include: { listing: { include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } } }, batch: { select: { batchNumber: true } }, actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const inbound = movements.filter((m) => Number(m.quantityChange) > 0);
  const outbound = movements.filter((m) => Number(m.quantityChange) < 0);
  const totalIn = inbound.reduce((sum, m) => sum + Number(m.quantityChange), 0);
  const totalOut = outbound.reduce((sum, m) => sum + Math.abs(Number(m.quantityChange)), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Inventory</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><ArrowRightLeft className="h-5 w-5" /></span>Stock Transfers & Movements</h1>
        <p className="mt-2 text-sm text-slate-500">Trace every inbound and outbound stock movement across the workspace.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Total movements</p><p className="mt-2 text-2xl font-semibold text-slate-900">{movements.length}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Units in</p><p className="mt-2 text-2xl font-semibold text-[#16a34a]">+{totalIn.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{inbound.length} inbound record{inbound.length === 1 ? "" : "s"}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Units out</p><p className="mt-2 text-2xl font-semibold text-[#b45309]">−{totalOut.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{outbound.length} outbound record{outbound.length === 1 ? "" : "s"}</p></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Movement history</h2><p className="mt-1 text-xs text-slate-500">Newest first, including purchases, sales, and adjustments.</p></div>
        {movements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Medicine</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Batch</th><th className="px-5 py-3 font-semibold">Change</th><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Actor</th><th className="px-5 py-3 font-semibold">Date</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {movements.map((row) => {
                  const meta = TYPE_META[row.type] ?? { label: row.type, icon: ArrowRightLeft, tone: "bg-slate-100 text-slate-600" };
                  const Icon = meta.icon;
                  const positive = Number(row.quantityChange) > 0;
                  return (
                    <tr key={row.id} className="hover:bg-[#f8fafc]/70">
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}><Icon className="h-3.5 w-3.5" />{meta.label}</span></td>
                      <td className="px-5 py-4"><p className="font-medium text-slate-900">{row.listing.product.name}</p><p className="text-xs text-slate-500">{row.listing.product.sku}</p></td>
                      <td className="px-5 py-4 text-slate-600">{row.listing.branch.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{row.batch?.batchNumber ?? "—"}</td>
                      <td className={`px-5 py-4 font-semibold ${positive ? "text-[#16a34a]" : "text-[#b45309]"}`}>{positive ? "+" : ""}{Number(row.quantityChange).toLocaleString()} {row.listing.product.unit}</td>
                      <td className="px-5 py-4 text-slate-600">{row.reference ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-600">{row.actor?.name ?? row.actor?.email ?? "System"}</td>
                      <td className="px-5 py-4 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><ArrowRightLeft className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No stock movements yet</p><p className="mt-2 text-sm text-slate-500">Purchases, sales, and adjustments will appear here.</p></div>
        )}
      </section>
    </div>
  );
}