import { redirect } from "next/navigation";
import Link from "next/link";
import { File, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function QuotationsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.view")) return <p className="surface-card p-8">Sales access unavailable for this role.</p>;

  const [customers, listings, business] = await Promise.all([
    prisma.customer.count({ where: { businessId: context.businessId, deletedAt: null } }),
    prisma.productListing.count({ where: { businessId: context.businessId, product: { deletedAt: null } } }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Sales</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><File className="h-5 w-5" /></span>Quotations</h1>
        <p className="mt-2 text-sm text-slate-500">Build price quotes from your live catalog and customer directory.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Customers available</p><p className="mt-2 text-2xl font-semibold text-slate-900">{customers}</p><p className="mt-1 text-xs text-slate-500">For quote addressing</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Catalog listings</p><p className="mt-2 text-2xl font-semibold text-slate-900">{listings}</p><p className="mt-1 text-xs text-slate-500">Across all branches</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Currency</p><p className="mt-2 text-2xl font-semibold text-slate-900">{currency}</p></div>
      </section>

      <section className="surface-card p-6">
        <h2 className="font-semibold text-slate-900">Create a quotation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Quotation drafting is prepared here. Use Point of Sale to pick items, quantities, and pricing from your live inventory and turn them into a sale when the customer accepts.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/sales/pos" className="button-primary">Open Point of Sale <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/dashboard/products" className="button-secondary">Browse catalog</Link>
          <Link href="/dashboard/customers" className="button-secondary">Manage customers</Link>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Quick quote builder</h2><p className="mt-1 text-xs text-slate-500">Estimated list price for a single unit of the most recently stocked items.</p></div>
        <QuotePreview />
      </section>
    </div>
  );
}

async function QuotePreview() {
  const context = await getTenantContext();
  if (!context?.businessId) return null;
  const listings = await prisma.productListing.findMany({ where: { businessId: context.businessId, product: { deletedAt: null } }, include: { product: { select: { name: true, sku: true, unit: true } }, branch: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 8 });
  if (!listings.length) return <div className="p-10 text-center text-sm text-slate-500">No catalog items available yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Item</th><th className="px-5 py-3 font-semibold">SKU</th><th className="px-5 py-3 font-semibold">Branch</th><th className="px-5 py-3 font-semibold">Unit</th><th className="px-5 py-3 font-semibold text-right">List price</th></tr></thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {listings.map((listing) => (
            <tr key={listing.id} className="hover:bg-[#f8fafc]/70">
              <td className="px-5 py-4 font-medium text-slate-900">{listing.product.name}</td>
              <td className="px-5 py-4 font-mono text-xs text-slate-600">{listing.product.sku}</td>
              <td className="px-5 py-4 text-slate-600">{listing.branch.name}</td>
              <td className="px-5 py-4 text-slate-600">{listing.product.unit}</td>
              <td className="px-5 py-4 text-right font-semibold text-slate-900">{`${listing.price.toString()}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}