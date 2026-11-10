"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, LoaderCircle, Minus, Plus, Printer, ScanBarcode, Search, ShoppingCart, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

type Branch = { id: string; name: string };
type Customer = { id: string; name: string; phone: string | null };
type Item = { id: string; productId: string; name: string; sku: string; barcode: string; brand: string; category: string; unit: string; imageUrl: string; description: string; branchId: string; branchName: string; price: number; availableStock: number };
type CartLine = { listingId: string; name: string; sku: string; unit: string; price: number; quantity: number; max: number };
type Receipt = { reference: string; total: number; subtotal: number; discount: number; tax: number; items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[]; customer: string; branch: string; soldAt: string };

export function PosClient({ branches, customers: initialCustomers, catalog, categories, currency, business, canCreateCustomer }: { branches: Branch[]; customers: Customer[]; catalog: Item[]; categories: string[]; currency: string; business: { name: string; address: string; phone: string }; canCreateCustomer: boolean }) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState(initialCustomers);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [held, setHeld] = useState<{ branchId: string; customerId: string; cart: CartLine[]; discount: string; taxRate: string; notes: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const branchItems = useMemo(() => catalog.filter((item) => item.branchId === branchId), [catalog, branchId]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branchItems.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return [item.name, item.sku, item.barcode, item.brand, item.category, item.description].some((v) => v.toLowerCase().includes(q));
    });
  }, [branchItems, query, category]);

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountAmount = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (Math.max(0, Number(taxRate) || 0) / 100);
  const total = taxable + taxAmount;
  const money = (n: number) => `${currency} ${n.toFixed(2)}`;

  function add(item: Item) {
    if (item.availableStock <= 0) { toast.error("No available stock for this medicine."); return; }
    setCart((prev) => {
      const existing = prev.find((l) => l.listingId === item.id);
      if (existing) {
        if (existing.quantity >= item.availableStock) { toast.error("Cannot exceed available stock."); return prev; }
        return prev.map((l) => l.listingId === item.id ? { ...l, quantity: Math.min(item.availableStock, l.quantity + 1) } : l);
      }
      return [...prev, { listingId: item.id, name: item.name, sku: item.sku, unit: item.unit, price: item.price, quantity: 1, max: item.availableStock }];
    });
  }

  function qty(listingId: string, next: number) {
    setCart((prev) => prev.map((l) => {
      if (l.listingId !== listingId) return l;
      const value = Math.max(1, Math.min(l.max, Math.floor(next) || 1));
      if (next > l.max) toast.error("Cannot exceed available stock.");
      return { ...l, quantity: value };
    }));
  }

  function onBarcodeSearch() {
    const code = query.trim();
    if (!code) return;
    const match = branchItems.find((i) => i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) || branchItems.find((i) => i.sku.toLowerCase() === code.toLowerCase());
    if (match) { add(match); setQuery(""); toast.success(`Added ${match.name}`); }
    else toast.error("No medicine found for that barcode/SKU in this branch.");
  }

  function hold() {
    if (!cart.length) { toast.error("Cart is empty."); return; }
    setHeld({ branchId, customerId, cart, discount, taxRate, notes });
    setCart([]); setDiscount("0"); setTaxRate("0"); setNotes("");
    toast.success("Order held.");
  }

  function resumeHeld() {
    if (!held) return;
    if (held.branchId !== branchId) { toast.error("Switch to the held order's branch to resume it."); return; }
    setCustomerId(held.customerId); setCart(held.cart); setDiscount(held.discount); setTaxRate(held.taxRate); setNotes(held.notes); setHeld(null);
    toast.success("Held order restored.");
  }

  async function createWalkInCustomer() {
    const name = window.prompt("Customer name");
    if (!name?.trim()) return;
    const phone = window.prompt("Phone (optional)") || undefined;
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), phone }) });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(payload.error ?? "Customer could not be created."); return; }
    setCustomers((prev) => [{ id: payload.data.id, name: payload.data.name, phone: payload.data.phone ?? null }, ...prev]);
    setCustomerId(payload.data.id);
    toast.success("Customer added.");
  }

  async function completeSale() {
    if (!branchId) { toast.error("Select a branch."); return; }
    if (!cart.length) { toast.error("Add at least one medicine."); return; }
    if (cart.some((l) => l.quantity > l.max || l.quantity <= 0)) { toast.error("Fix quantities before completing the sale."); return; }
    if (discountAmount > subtotal) { toast.error("Discount cannot exceed subtotal."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          customerId: customerId || undefined,
          notes: notes || undefined,
          discount: discountAmount,
          tax: taxAmount,
          items: cart.map((l) => ({ productListingId: l.listingId, quantity: l.quantity })),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Sale could not be completed.");
      const customerName = customers.find((c) => c.id === customerId)?.name ?? "Walk-in";
      const branchName = branches.find((b) => b.id === branchId)?.name ?? "Branch";
      setReceipt({ reference: payload.data.reference, subtotal, discount: discountAmount, tax: taxAmount, total, items: cart.map((l) => ({ name: l.name, quantity: l.quantity, unitPrice: l.price, lineTotal: l.price * l.quantity })), customer: customerName, branch: branchName, soldAt: payload.data.soldAt ?? new Date().toISOString() });
      setCart([]); setDiscount("0"); setTaxRate("0"); setNotes(""); setCustomerId("");
      toast.success(`Sale ${payload.data.reference} completed.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sale could not be completed.");
    } finally { setBusy(false); }
  }

  function printReceipt() {
    if (!receipt) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${receipt.reference}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px;font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 4px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:13px}.right{text-align:right}.totals{margin-top:16px;max-width:280px;margin-left:auto}</style></head><body><h1>${business.name}</h1><div>${business.address || ""}</div><div>${business.phone || ""}</div><hr/><div><strong>Receipt:</strong> ${receipt.reference}</div><div><strong>Date:</strong> ${new Date(receipt.soldAt).toLocaleString()}</div><div><strong>Branch:</strong> ${receipt.branch}</div><div><strong>Customer:</strong> ${receipt.customer}</div><table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${receipt.items.map((i) => `<tr><td>${i.name}</td><td class="right">${i.quantity}</td><td class="right">${money(i.unitPrice)}</td><td class="right">${money(i.lineTotal)}</td></tr>`).join("")}</tbody></table><div class="totals"><div>Subtotal: <span style="float:right">${money(receipt.subtotal)}</span></div><div>Discount: <span style="float:right">-${money(receipt.discount)}</span></div><div>Tax: <span style="float:right">${money(receipt.tax)}</span></div><div style="font-weight:700;margin-top:8px">Grand Total: <span style="float:right">${money(receipt.total)}</span></div></div><script>window.print()</script></body></html>`;
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) { toast.error("Allow pop-ups to print receipts."); return; }
    win.document.write(html); win.document.close();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_420px]">
      <section className="space-y-4">
        <div className="surface-card p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto]">
            <label className="field-label !mt-0">Branch<select className="input-control" value={branchId} onChange={(e) => { setBranchId(e.target.value); setCart([]); }}><option value="" disabled>Choose branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            <label className="field-label !mt-0">Search medicine<div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input ref={barcodeRef} className="input-control !pl-9" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onBarcodeSearch())} placeholder="Name, SKU, barcode, brand, category..." /></div></label>
            <div className="flex items-end gap-2"><button type="button" className="button-secondary inline-flex h-[46px] items-center gap-2" onClick={onBarcodeSearch}><ScanBarcode size={16} /> Find barcode</button><button type="button" className="button-secondary inline-flex h-[46px] items-center gap-2" onClick={() => barcodeRef.current?.focus()} title="Focus barcode/search input"><Barcode size={16} /> Scan</button></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{["All", ...categories.filter(Boolean)].map((c) => <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === c ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{c}</button>)}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="surface-card flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-gray-100 text-black border border-gray-200">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-14 rounded-xl object-cover" /> : <PillIcon />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-black">{item.name}</h3>
                  <p className="mt-1 text-xs text-gray-600">{item.brand || item.sku} · {item.unit}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{item.category}{item.barcode ? ` · ${item.barcode}` : ""}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-black">{money(item.price)}</p>
                  <p className={`mt-1 text-xs font-medium ${item.availableStock <= 0 ? "text-black font-semibold" : item.availableStock <= 10 ? "text-gray-700" : "text-black"}`}>{item.availableStock} in stock</p>
                </div>
                <button type="button" className="button-primary !py-2 !px-3 !text-xs" onClick={() => add(item)} disabled={item.availableStock <= 0 || !branchId}>Add</button>
              </div>
            </article>
          ))}
          {!filtered.length && <div className="surface-card col-span-full p-10 text-center text-sm text-gray-600">No medicines match this search in the selected branch.</div>}
        </div>
      </section>

      <aside className="surface-card flex h-fit flex-col xl:sticky xl:top-24">
        <div className="border-b border-gray-200 p-5">
          <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-black"><ShoppingCart size={18} className="text-black" /> Current order</h2><p className="mt-1 text-xs text-gray-600">{cart.length} item{cart.length === 1 ? "" : "s"}</p></div>{held && <button type="button" className="text-xs font-semibold text-black" onClick={resumeHeld}>Resume held</button>}</div>
          <div className="mt-4 flex gap-2">
            <label className="field-label !mt-0 flex-1">Customer<select className="input-control" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}</select></label>
            {canCreateCustomer && <button type="button" className="button-secondary mt-6 inline-flex h-[46px] items-center px-3" title="Add customer" onClick={createWalkInCustomer}><UserPlus size={16} /></button>}
          </div>
        </div>

        <div className="max-h-[320px] space-y-3 overflow-auto p-5">
          {cart.map((line) => (
            <div key={line.listingId} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-black">{line.name}</p><p className="text-xs text-gray-600">{money(line.price)} / {line.unit} · max {line.max}</p></div><button type="button" className="text-gray-500 hover:text-black font-semibold" onClick={() => setCart((p) => p.filter((x) => x.listingId !== line.listingId))} aria-label="Remove"><X size={16} /></button></div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center rounded-lg border border-gray-200"><button type="button" className="p-2 text-gray-600" onClick={() => qty(line.listingId, line.quantity - 1)}><Minus size={14} /></button><input className="w-12 border-x border-gray-200 py-1.5 text-center text-sm" value={line.quantity} onChange={(e) => qty(line.listingId, Number(e.target.value))} inputMode="numeric" /><button type="button" className="p-2 text-gray-600" onClick={() => qty(line.listingId, line.quantity + 1)}><Plus size={14} /></button></div>
                <p className="text-sm font-semibold text-black">{money(line.price * line.quantity)}</p>
              </div>
            </div>
          ))}
          {!cart.length && <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-600">Select medicines from the left to build an order.</div>}
        </div>

        <div className="space-y-4 border-t border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label !mt-0">Discount ({currency})<input className="input-control" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
            <label className="field-label !mt-0">Tax %<input className="input-control" type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></label>
          </div>
          <label className="field-label !mt-0">Notes<input className="input-control" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /></label>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span>-{money(discountAmount)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>{money(taxAmount)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-black"><span>Grand total</span><span>{money(total)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="button-secondary" onClick={hold} disabled={!cart.length || busy}>Hold order</button>
            <button type="button" className="button-secondary" onClick={() => { setCart([]); setDiscount("0"); setTaxRate("0"); setNotes(""); }} disabled={busy}><span className="inline-flex items-center gap-1"><Trash2 size={14} /> Clear cart</span></button>
          </div>
          <button type="button" className="button-primary w-full" onClick={completeSale} disabled={busy || !cart.length || !branchId}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShoppingCart size={16} />} Complete sale</button>
          {receipt && <button type="button" className="button-secondary w-full" onClick={printReceipt}><span className="inline-flex items-center gap-2"><Printer size={16} /> Print receipt ({receipt.reference})</span></button>}
        </div>
      </aside>
    </div>
  );
}

function PillIcon() {
  return <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="1.8"><rect x="3" y="8" width="18" height="8" rx="4" /><path d="M12 8v8" /><path d="M7 12h2.5M14.5 12H17" opacity=".55" /></svg>;
}
