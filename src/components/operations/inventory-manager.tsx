"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PackageCheck, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

type Listing = { id: string; name: string; sku: string; unit: string; branch: string; quantity: number };
type Movement = { id: string; product: string; sku: string; branch: string; batch: string; type: string; quantityChange: string; reference: string; note: string; createdAt: string; actor: string };

export function InventoryManager({ listings, movements, canAdjust }: { listings: Listing[]; movements: Movement[]; canAdjust: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError("");
    const expiry = values.get("expiryDate")?.toString();
    try {
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productListingId: values.get("productListingId"),
          quantityChange: Number(values.get("quantityChange")),
          note: values.get("note"),
          batchNumber: values.get("batchNumber") || undefined,
          expiryDate: expiry ? new Date(expiry).toISOString() : undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Stock adjustment failed.");
      toast.success("Stock adjustment recorded");
      form.reset();
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Please try again.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((item) => !q || [item.name, item.sku, item.branch, item.unit].join(" ").toLowerCase().includes(q));
  }, [listings, query]);

  return <div className="space-y-6">
    {canAdjust && <section className="surface-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><SlidersHorizontal className="h-5 w-5" /></span>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16a34a]">Inventory control</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Record a stock adjustment</h2><p className="mt-1 text-sm text-slate-500">Positive adjustments create a batch. Negative adjustments consume earliest-expiring unexpired stock. Every change is audited.</p></div>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="field-label xl:col-span-2">Medicine / branch listing<select className="input-control" name="productListingId" defaultValue="" required><option value="" disabled>Select medicine listing</option>{listings.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku} · {item.branch} ({item.quantity} {item.unit})</option>)}</select></label>
        <label className="field-label">Quantity change<input className="input-control" type="number" name="quantityChange" step="0.001" required placeholder="e.g. 10 or -2" /></label>
        <label className="field-label">Batch number <span className="font-normal text-slate-400">(for additions)</span><input className="input-control" name="batchNumber" maxLength={64} placeholder="Auto if blank" /></label>
        <label className="field-label">Expiry date <span className="font-normal text-slate-400">(for additions)</span><input className="input-control" type="date" name="expiryDate" /></label>
        <label className="field-label">Reason *<input className="input-control" name="note" minLength={3} maxLength={500} required placeholder="e.g. Damaged stock write-off, recount correction" /></label>
        {error && <p role="alert" className="alert-error sm:col-span-2 xl:col-span-3">{error}</p>}
        <div className="sm:col-span-2 xl:col-span-3"><button className="button-primary" disabled={busy || listings.length === 0}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Save adjustment</button></div>
      </form>
    </section>}

    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Available stock by branch</h2><p className="mt-1 text-xs text-slate-500">Live quantities exclude expired and archived batches.</p></div>
        <div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input-control !mt-0 !pl-9 !py-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter stock..." /></div>
      </div>
      {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Medicine", "SKU", "Branch", "Available"].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#e5e7eb]">{filtered.map((item) => <tr key={item.id} className="hover:bg-[#f8fafc]/70"><td className="px-5 py-4 font-medium text-slate-900">{item.name}</td><td className="px-5 py-4 text-slate-600">{item.sku}</td><td className="px-5 py-4 text-slate-600">{item.branch}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.quantity <= 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : item.quantity <= 10 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-[#f1fce0] text-[#3f6212] ring-1 ring-[#d9f99d]"}`}>{item.quantity} {item.unit}</span></td></tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center text-sm text-slate-500">{listings.length ? "No listings match your filter." : "Create medicine listings to begin tracking stock."}</div>}
    </section>

    <section className="surface-card overflow-hidden">
      <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">Stock movement history</h2><p className="mt-1 text-xs text-slate-500">Purchases, sales, opening stock, and adjustments are recorded as append-only audit events.</p></div>
      {movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Date", "Medicine", "Branch", "Type", "Change", "Batch", "Reference", "Reason", "Recorded by"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#e5e7eb]">{movements.map((item) => <tr key={item.id} className="hover:bg-[#f8fafc]/70"><td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td><td className="px-4 py-3"><p className="font-medium text-slate-900">{item.product}</p><p className="text-xs text-slate-500">{item.sku}</p></td><td className="px-4 py-3 text-slate-600">{item.branch}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">{item.type.toLowerCase()}</span></td><td className={`px-4 py-3 font-semibold ${Number(item.quantityChange) < 0 ? "text-red-600" : "text-[#16a34a]"}`}>{Number(item.quantityChange) > 0 ? "+" : ""}{item.quantityChange}</td><td className="px-4 py-3 text-slate-600">{item.batch || "—"}</td><td className="px-4 py-3 text-slate-600">{item.reference || "—"}</td><td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={item.note}>{item.note || "—"}</td><td className="px-4 py-3 text-slate-600">{item.actor}</td></tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center text-sm text-slate-500">Stock movements will appear here when inventory changes.</div>}
    </section>
  </div>;
}
