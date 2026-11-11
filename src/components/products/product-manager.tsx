"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LoaderCircle, PackagePlus, Pill, Search, SlidersHorizontal, LayoutGrid, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";
import { MedicineIllustration, DOSAGE_FORMS } from "@/components/medicine/MedicineIllustration";
import { encodeMedicineMeta, decodeMedicineMeta } from "@/lib/medicine-meta";
import { cn } from "@/lib/utils";

type Branch = { id: string; name: string; code: string };
type Category = { id: string; name: string };
type ProductRow = { id: string; name: string; sku: string; category: string | null; unit: string; description?: string | null; listings: { id: string; price: string; marketplaceEnabled: boolean; branch: { name: string }; remainingQuantity: number }[] };

export function ProductManager({ branches, categories = [], products, canCreate }: { branches: Branch[]; categories?: Category[]; products: ProductRow[]; canCreate: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<"name" | "stock" | "price">("name");
  const [view, setView] = useState<"cards" | "table">("cards");
  const router = useRouter();

  // Live preview state for the medicine being added
  const [preview, setPreview] = useState({ name: "", genericName: "", strength: "", dosageForm: "Tablet", category: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError("");
    const expiry = values.get("expiryDate")?.toString();
    const description = encodeMedicineMeta({
      dosageForm: values.get("dosageForm")?.toString(),
      genericName: values.get("genericName")?.toString(),
      strength: values.get("strength")?.toString(),
      manufacturer: values.get("manufacturer")?.toString(),
      notes: values.get("description")?.toString(),
    });
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.get("name"), sku: values.get("sku"), barcode: values.get("barcode") || undefined,
        brand: values.get("brand") || undefined, categoryId: values.get("categoryId") || undefined,
        description,
        imageUrl: undefined,
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
    toast.success("Medicine saved with opening stock");
    form.reset();
    setPreview({ name: "", genericName: "", strength: "", dosageForm: "Tablet", category: "" });
    setShowForm(false);
    router.refresh();
  }

  const categoryNames = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort(), [products]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .map((p) => {
        const meta = decodeMedicineMeta(p.description);
        const categoryName = p.category ?? meta.genericName ?? "Uncategorized";
        return { ...p, meta, categoryName, totalStock: p.listings.reduce((s, l) => s + l.remainingQuantity, 0), minPrice: p.listings.length ? Math.min(...p.listings.map((l) => Number(l.price))) : 0 };
      })
      .filter((p) => (categoryFilter === "all" || p.categoryName === categoryFilter))
      .filter((p) => !q || [p.name, p.sku, p.categoryName, p.unit, p.meta.genericName ?? "", p.meta.strength ?? "", ...p.listings.map((l) => l.branch.name)].join(" ").toLowerCase().includes(q))
      .sort((a, b) => sort === "stock" ? b.totalStock - a.totalStock : sort === "price" ? b.minPrice - a.minPrice : a.name.localeCompare(b.name));
  }, [products, query, categoryFilter, sort]);

  const previewCategory = categories.find((c) => c.name === preview.category)?.name ?? preview.category;

  return <div className="space-y-5">
    <section className="surface-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input-control !mt-0 !pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines by name, SKU, category, branch..." />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input-control !mt-0 !w-auto min-w-[160px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-control !mt-0 !w-auto min-w-[150px]" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            <option value="price">Sort: Price</option>
          </select>
          <div className="inline-flex overflow-hidden rounded-xl border border-[#e8eee8]">
            <button type="button" onClick={() => setView("cards")} className={cn("inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition", view === "cards" ? "bg-[#003d32] text-white" : "bg-white text-slate-500 hover:bg-[#f1f7ee]")}><LayoutGrid className="h-3.5 w-3.5" /> Cards</button>
            <button type="button" onClick={() => setView("table")} className={cn("inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold transition", view === "table" ? "bg-[#003d32] text-white" : "bg-white text-slate-500 hover:bg-[#f1f7ee]")}><TableIcon className="h-3.5 w-3.5" /> Table</button>
          </div>
          {canCreate && <button type="button" className="button-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? <ChevronUp className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />} {showForm ? "Close form" : "Add medicine"}</button>}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{rows.length} medicine{rows.length === 1 ? "" : "s"} shown · {products.length} total in workspace. Expired batches are excluded from available stock.</p>
    </section>

    {canCreate && showForm && <section className="surface-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Pill className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16a34a]">Medicine catalog</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Add medicine and opening stock</h2><p className="mt-1 text-sm text-slate-500">Records are saved to MySQL for this pharmacy workspace. Stock is tracked by batch and branch.</p></div></div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-3">
          <div className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <MedicineIllustration
                medicineName={preview.name || "Medicine"}
                genericName={preview.genericName}
                strength={preview.strength}
                dosageForm={preview.dosageForm}
                category={previewCategory || preview.name}
                size={132}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16a34a]">Live preview</p>
              <p className="mt-1 text-sm text-slate-600">The illustration updates as you type. It is generated dynamically from the medicine details — no image upload needed.</p>
              <p className="mt-2 text-xs text-slate-400">Dosage form and category determine the artwork and palette.</p>
            </div>
          </div>
        </div>
        <label className="field-label">Medicine name *<input className="input-control" name="name" required minLength={2} maxLength={191} placeholder="e.g. Amoxicillin" value={preview.name} onChange={(e) => setPreview((p) => ({ ...p, name: e.target.value }))} /></label>
        <label className="field-label">Generic name<input className="input-control" name="genericName" maxLength={191} placeholder="e.g. Amoxicillin trihydrate" value={preview.genericName} onChange={(e) => setPreview((p) => ({ ...p, genericName: e.target.value }))} /></label>
        <label className="field-label">Strength / dosage<input className="input-control" name="strength" maxLength={120} placeholder="e.g. 500mg" value={preview.strength} onChange={(e) => setPreview((p) => ({ ...p, strength: e.target.value }))} /></label>
        <label className="field-label">Dosage form<select className="input-control" name="dosageForm" value={preview.dosageForm} onChange={(e) => setPreview((p) => ({ ...p, dosageForm: e.target.value }))}>{DOSAGE_FORMS.map((form) => <option key={form} value={form}>{form}</option>)}</select></label>
        <label className="field-label">SKU *<input className="input-control" name="sku" required maxLength={64} placeholder="Unique SKU" /></label>
        <label className="field-label">Barcode<input className="input-control" name="barcode" maxLength={128} /></label>
        <label className="field-label">Brand<input className="input-control" name="brand" maxLength={120} /></label>
        <label className="field-label">Manufacturer<input className="input-control" name="manufacturer" maxLength={191} /></label>
        <label className="field-label">Category<select className="input-control" name="categoryId" value={preview.category} onChange={(e) => { const name = categories.find((c) => c.id === e.target.value)?.name ?? ""; setPreview((p) => ({ ...p, category: name })); }}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="field-label">Unit *<input className="input-control" name="unit" maxLength={32} defaultValue="unit" required /></label>
        <label className="field-label">Branch *<select className="input-control" name="branchId" required defaultValue=""><option value="" disabled>Choose branch</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label>
        <label className="field-label">Selling price *<input className="input-control" name="price" type="number" min="0.01" step="0.01" required /></label>
        <label className="field-label">Opening quantity *<input className="input-control" name="quantity" type="number" min="0" step="0.001" defaultValue="0" required /></label>
        <label className="field-label">Batch number<input className="input-control" name="batchNumber" maxLength={64} placeholder="Auto if blank" /></label>
        <label className="field-label">Expiry date<input className="input-control" name="expiryDate" type="date" /></label>
        <label className="field-label sm:col-span-2 xl:col-span-3">Description / notes<textarea className="input-control min-h-20 resize-y" name="description" maxLength={4000} placeholder="Additional medicine details, usage notes, or supplier info" /></label>
        <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 sm:col-span-2 xl:col-span-3">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="marketplaceEnabled" defaultChecked className="accent-[#16a34a]" /> List publicly when stock is available</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="pickupEnabled" defaultChecked className="accent-[#16a34a]" /> Pickup available</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="deliveryEnabled" className="accent-[#16a34a]" /> Delivery available</label>
        </div>
        {error && <p role="alert" className="alert-error sm:col-span-2 xl:col-span-3">{error}</p>}
        <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-3">
          <button className="button-primary" disabled={busy || branches.length === 0}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Save medicine</button>
          <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          {branches.length === 0 && <p className="text-xs text-amber-700">Add an active branch before adding medicines.</p>}
        </div>
      </form>
    </section>}

    {rows.length ? (
      view === "cards" ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((product) => {
            const meta = product.meta;
            return (
              <article key={product.id} className="group surface-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(0,61,50,0.25)]">
                <div className="relative flex items-center justify-center bg-gradient-to-br from-[#f7fbf4] to-[#eef5ea] p-4">
                  <MedicineIllustration
                    medicineName={product.name}
                    genericName={meta.genericName}
                    strength={meta.strength}
                    dosageForm={meta.dosageForm}
                    category={product.category}
                    size={168}
                    className="transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span className={cn("absolute right-3 top-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", product.totalStock <= 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : product.totalStock <= 10 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-[#f1fce0] text-[#3f6212] ring-1 ring-[#d9f99d]")}>{product.totalStock} {product.unit}</span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">{product.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{[meta.strength, meta.dosageForm].filter(Boolean).join(" · ") || product.unit}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#16a34a]">{product.minPrice ? `${product.minPrice.toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex rounded-full bg-[#f1f7ee] px-2 py-0.5 text-[11px] font-medium text-[#3f6212]">{product.category ?? "Uncategorized"}</span>
                    {meta.genericName && <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{meta.genericName}</span>}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#eef2ee] pt-2 text-[11px] text-slate-500">
                    <span>{product.sku}</span>
                    <span>{product.listings.length} branch listing{product.listings.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <div><h2 className="font-semibold text-slate-900">All medicines</h2><p className="mt-1 text-xs text-slate-500">Live catalog and available stock by branch listing.</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-slate-600"><SlidersHorizontal className="h-3.5 w-3.5" /> {rows.length} results</span>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Medicine</th><th className="px-5 py-3 font-semibold">SKU / Category</th><th className="px-5 py-3 font-semibold">Branch listings</th><th className="px-5 py-3 font-semibold">Price range</th><th className="px-5 py-3 font-semibold">Available stock</th><th className="px-5 py-3 font-semibold">Marketplace</th></tr></thead><tbody className="divide-y divide-[#e5e7eb]">{rows.map((product) => {
            const listed = product.listings.some((l) => l.marketplaceEnabled);
            const prices = product.listings.map((l) => Number(l.price));
            const priceLabel = prices.length ? (Math.min(...prices) === Math.max(...prices) ? Math.min(...prices).toFixed(2) : `${Math.min(...prices).toFixed(2)} – ${Math.max(...prices).toFixed(2)}`) : "—";
            return <tr key={product.id} className="align-top hover:bg-[#f8fafc]/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><MedicineIllustration medicineName={product.name} genericName={product.meta.genericName} strength={product.meta.strength} dosageForm={product.meta.dosageForm} category={product.category} size={44} /><div><p className="font-semibold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.unit}</p></div></div></td><td className="px-5 py-4 text-slate-600"><p className="font-medium text-slate-700">{product.sku}</p><p className="mt-1 text-xs text-slate-500">{product.category || "Uncategorized"}</p></td><td className="px-5 py-4 text-slate-600">{product.listings.length ? <div className="space-y-1">{product.listings.map((l) => <div key={l.id} className="flex items-center justify-between gap-3 text-xs"><span>{l.branch.name}</span><span className="font-medium text-slate-700">{l.remainingQuantity} {product.unit}</span></div>)}</div> : <span className="text-xs text-slate-400">No branch listing</span>}</td><td className="px-5 py-4 font-medium text-slate-800">{priceLabel}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${product.totalStock <= 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : product.totalStock <= 10 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-[#f1fce0] text-[#3f6212] ring-1 ring-[#d9f99d]"}`}>{product.totalStock} {product.unit}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${listed ? "bg-[#f1fce0] text-[#166534] ring-1 ring-[#d9f99d]" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{listed ? "Listed" : "Hidden"}</span></td></tr>;
          })}</tbody></table></div>
        </section>
      )
    ) : <div className="surface-card px-6 py-14 text-center"><Pill className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No medicines found</p><p className="mt-2 text-sm text-slate-500">{products.length ? "Try adjusting your search or filters." : "Add your first medicine to start managing inventory, sales, and expiry."}</p></div>}
  </div>;
}
