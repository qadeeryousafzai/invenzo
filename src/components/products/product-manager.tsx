"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PackagePlus } from "lucide-react";
import { toast } from "sonner";

type Branch = { id: string; name: string; code: string };
type ProductRow = { id: string; name: string; sku: string; category: string | null; unit: string; listings: { id: string; price: string; marketplaceEnabled: boolean; branch: { name: string }; remainingQuantity: number }[] };

export function ProductManager({ branches, products, canCreate }: { branches: Branch[]; products: ProductRow[]; canCreate: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError("");
    const expiry = values.get("expiryDate")?.toString();
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.get("name"), sku: values.get("sku"), barcode: values.get("barcode") || undefined,
        brand: values.get("brand") || undefined, category: values.get("category") || undefined,
        description: values.get("description") || undefined, imageUrl: values.get("imageUrl") || undefined,
        unit: values.get("unit"), branchId: values.get("branchId"), price: Number(values.get("price")),
        initialQuantity: Number(values.get("quantity")), batchNumber: values.get("batchNumber") || undefined,
        expiryDate: expiry ? new Date(expiry).toISOString() : undefined,
        marketplaceEnabled: values.get("marketplaceEnabled") === "on",
        pickupEnabled: values.get("pickupEnabled") === "on",
        deliveryEnabled: values.get("deliveryEnabled") === "on",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { const message = payload.error ?? "Product could not be saved."; setError(message); toast.error(message); return; }
    toast.success("Product and opening stock saved");
    form.reset();
    router.refresh();
  }

  return <div className="space-y-6">
    {canCreate && <section className="surface-card p-5 sm:p-6"><div className="mb-5"><p className="text-xs font-bold tracking-[.15em] text-emerald-800">CATALOG</p><h2 className="mt-2 text-lg font-semibold text-slate-950">Add a product and opening stock</h2><p className="mt-1 text-sm text-slate-500">Stock is recorded as a batch. Expired batches are excluded from public search.</p></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="field-label">Product name<input className="input-control" name="name" required minLength={2} maxLength={191} /></label>
      <label className="field-label">SKU<input className="input-control" name="sku" required maxLength={64} /></label>
      <label className="field-label">Category<input className="input-control" name="category" maxLength={120} placeholder="e.g. Household" /></label>
      <label className="field-label">Brand<input className="input-control" name="brand" maxLength={120} /></label>
      <label className="field-label">Barcode<input className="input-control" name="barcode" maxLength={128} /></label>
      <label className="field-label">Unit<input className="input-control" name="unit" maxLength={32} defaultValue="unit" required /></label>
      <label className="field-label">Branch<select className="input-control" name="branchId" required defaultValue=""><option value="" disabled>Choose branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label>
      <label className="field-label">Selling price<input className="input-control" name="price" type="number" min="0.01" step="0.01" required /></label>
      <label className="field-label">Opening quantity<input className="input-control" name="quantity" type="number" min="0" step="0.001" defaultValue="0" required /></label>
      <label className="field-label">Batch number <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="batchNumber" maxLength={64} /></label>
      <label className="field-label">Expiry date <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="expiryDate" type="date" /></label>
      <label className="field-label">Product image URL <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="imageUrl" type="url" maxLength={2000} placeholder="https://…" /></label>
      <label className="field-label sm:col-span-2 xl:col-span-3">Description <span className="font-normal text-slate-400">(optional)</span><textarea className="input-control min-h-20 resize-y" name="description" maxLength={4000} /></label>
      <div className="flex flex-wrap gap-x-6 gap-y-3 sm:col-span-2 xl:col-span-3">
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="marketplaceEnabled" defaultChecked className="accent-[#175b45]" /> List publicly when stock is available</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="pickupEnabled" defaultChecked className="accent-[#175b45]" /> Pickup available</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="deliveryEnabled" className="accent-[#175b45]" /> Delivery available</label>
      </div>
      {error && <p role="alert" className="alert-error sm:col-span-2 xl:col-span-3">{error}</p>}
      <div className="sm:col-span-2 xl:col-span-3"><button className="button-primary" disabled={busy || branches.length === 0}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <PackagePlus size={16} />} Save product</button>{branches.length === 0 && <p className="mt-2 text-xs text-amber-700">Add an active branch before adding products.</p>}</div>
    </form></section>}

    <section className="surface-card overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Products in this workspace</h2><p className="mt-1 text-xs text-slate-500">Remaining batch stock; expired batches are excluded from marketplace search.</p></div>{products.length ? <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-[#fafbfa] text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">SKU / category</th><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Remaining stock</th><th className="px-5 py-3">Marketplace</th></tr></thead><tbody className="divide-y divide-slate-100">{products.flatMap((product) => product.listings.map((listing) => <tr key={listing.id}><td className="px-5 py-4 font-semibold text-slate-800">{product.name}</td><td className="px-5 py-4 text-xs text-slate-500">{product.sku}{product.category ? ` · ${product.category}` : ""}</td><td className="px-5 py-4 text-slate-600">{listing.branch.name}</td><td className="px-5 py-4 text-slate-700">{Number(listing.price).toFixed(2)}</td><td className="px-5 py-4 text-slate-700">{listing.remainingQuantity} {product.unit}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${listing.marketplaceEnabled ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{listing.marketplaceEnabled ? "Listed" : "Hidden"}</span></td></tr>))}</tbody></table></div> : <div className="px-6 py-12 text-center"><p className="font-semibold text-slate-800">No products added yet</p><p className="mt-2 text-sm text-slate-500">Add products and stock to make available items searchable in the marketplace.</p></div>}</section>
  </div>;
}
