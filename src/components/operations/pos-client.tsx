"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote, Barcode, CreditCard, LoaderCircle, Minus, PauseCircle, Pill, Plus, Printer, ScanBarcode,
  Search, ShoppingCart, Trash2, UserPlus, Wallet, X,
} from "lucide-react";
import { toast } from "sonner";

type Branch = { id: string; name: string };
type Customer = { id: string; name: string; phone: string | null };
type Item = { id: string; productId: string; name: string; sku: string; barcode: string; brand: string; category: string; unit: string; strength: string; imageUrl: string; branchId: string; branchName: string; price: number; availableStock: number; packSize: number; packUnit: string | null };
type CartLine = { listingId: string; name: string; sku: string; unit: string; strength: string; price: number; quantity: number; max: number; packSize: number; packUnit: string | null; sellUnit: "unit" | "pack" };
type ReceiptItem = { name: string; quantity: number; unitPrice: number; lineTotal: number; unitLabel?: string };
type PaymentMethod = "cash" | "card" | "other";
type HeldOrder = { id: string; label: string; branchId: string; customerId: string; cart: CartLine[]; discount: string; taxRate: string; notes: string; paymentMethod: PaymentMethod; amountTendered: string };
type Receipt = { reference: string; total: number; subtotal: number; discount: number; tax: number; paymentMethod: PaymentMethod; amountTendered: number; change: number; items: ReceiptItem[]; customer: string; branch: string; soldAt: string };

export function PosClient({ branches, customers: initialCustomers, catalog, categories, currency, business, canCreateCustomer }: {
  branches: Branch[]; customers: Customer[]; catalog: Item[]; categories: string[]; currency: string; business: { name: string; address: string; phone: string }; canCreateCustomer: boolean;
}) {
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const currencyCode = (currency || "PKR").toUpperCase();
  const branchItems = useMemo(() => catalog.filter((item) => item.branchId === branchId), [catalog, branchId]);
  const categoryOptions = useMemo(() => ["All", ...Array.from(new Set(categories.filter(Boolean))).sort()], [categories]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branchItems.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return [item.name, item.sku, item.barcode, item.brand, item.category, item.strength, item.unit].some((v) => v.toLowerCase().includes(q));
    });
  }, [branchItems, query, category]);

  const unitsPerLine = (line: CartLine) => (line.sellUnit === "pack" ? line.quantity * line.packSize : line.quantity);
  const maxQtyFor = (line: CartLine) => Math.max(1, Math.floor(line.max / (line.sellUnit === "pack" ? line.packSize : 1)));
  const subtotal = cart.reduce((sum, line) => sum + line.price * unitsPerLine(line), 0);
  const discountAmount = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (Math.max(0, Number(taxRate) || 0) / 100);
  const total = taxable + taxAmount;
  const tendered = paymentMethod === "cash" ? Math.max(0, Number(amountTendered) || 0) : total;
  const change = paymentMethod === "cash" ? Math.max(0, tendered - total) : 0;
  const currencySymbol = currencyCode === "PKR" ? "Rs" : currencyCode;
  const money = (n: number) => `${currencySymbol} ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function add(item: Item) {
    if (!branchId) { toast.error("Select a branch first."); return; }
    if (item.availableStock <= 0) { toast.error("No available stock for this medicine."); return; }
    setCart((prev) => {
      const existing = prev.find((l) => l.listingId === item.id);
      if (existing) {
        if (existing.quantity >= item.availableStock) { toast.error("Cannot exceed available stock."); return prev; }
        return prev.map((l) => l.listingId === item.id ? { ...l, quantity: Math.min(item.availableStock, l.quantity + 1) } : l);
      }
      const packSize = item.packSize > 1 ? item.packSize : 1;
      return [...prev, {
        listingId: item.id, name: item.name, sku: item.sku, unit: item.unit, strength: item.strength,
        price: item.price, quantity: 1, max: item.availableStock, packSize,
        packUnit: item.packUnit, sellUnit: packSize > 1 ? "pack" : "unit",
      }];
    });
  }

  function qty(listingId: string, next: number) {
    setCart((prev) => prev.map((l) => {
      if (l.listingId !== listingId) return l;
      const limit = maxQtyFor(l);
      const value = Math.max(1, Math.min(limit, Math.floor(next) || 1));
      if (next > limit) toast.error("Cannot exceed available stock.");
      return { ...l, quantity: value };
    }));
  }

  function setSellUnit(listingId: string, sellUnit: "unit" | "pack") {
    setCart((prev) => prev.map((l) => (l.listingId === listingId ? { ...l, sellUnit, quantity: 1 } : l)));
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
    const label = `Held ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${cart.length} item${cart.length === 1 ? "" : "s"}`;
    setHeldOrders((prev) => [{ id: crypto.randomUUID(), label, branchId, customerId, cart, discount, taxRate, notes, paymentMethod, amountTendered }, ...prev].slice(0, 10));
    setCart([]); setDiscount("0"); setTaxRate("0"); setNotes(""); setAmountTendered(""); setPaymentMethod("cash");
    toast.success("Order held.");
  }

  function resumeHeld(order: HeldOrder) {
    if (order.branchId !== branchId) { setBranchId(order.branchId); }
    setCustomerId(order.customerId); setCart(order.cart); setDiscount(order.discount); setTaxRate(order.taxRate); setNotes(order.notes); setPaymentMethod(order.paymentMethod); setAmountTendered(order.amountTendered);
    setHeldOrders((prev) => prev.filter((h) => h.id !== order.id));
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

  function clearCart() {
    if (busy) return;
    setCart([]); setDiscount("0"); setTaxRate("0"); setNotes(""); setAmountTendered("");
  }

  async function completeSale(options: { print?: boolean } = {}) {
    if (!branchId) { toast.error("Select a branch."); return; }
    if (!cart.length) { toast.error("Add at least one medicine."); return; }
    if (cart.some((l) => unitsPerLine(l) > l.max || l.quantity <= 0)) { toast.error("Fix quantities before completing the sale."); return; }
    if (discountAmount > subtotal) { toast.error("Discount cannot exceed subtotal."); return; }
    if (paymentMethod === "cash" && tendered < total) { toast.error("Cash received must be at least the grand total."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          customerId: customerId || undefined,
          notes: notes || undefined,
          discount: Number(discountAmount.toFixed(2)),
          tax: Number(taxAmount.toFixed(2)),
          paymentMethod,
          amountTendered: Number(tendered.toFixed(2)),
          items: cart.map((l) => ({ productListingId: l.listingId, quantity: unitsPerLine(l) })),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Sale could not be completed.");
      const customerName = customers.find((c) => c.id === customerId)?.name ?? "Walk-in customer";
      const branchName = branches.find((b) => b.id === branchId)?.name ?? "Branch";
      const soldReceipt: Receipt = {
        reference: payload.data.reference,
        subtotal, discount: discountAmount, tax: taxAmount, total,
        paymentMethod, amountTendered: tendered, change,
        items: cart.map((l) => ({
          name: l.name,
          quantity: unitsPerLine(l),
          unitPrice: l.price,
          lineTotal: l.price * unitsPerLine(l),
          unitLabel: l.sellUnit === "pack" ? `${l.packUnit ?? "Pack"} ×${l.packSize}` : l.unit,
        })),
        customer: customerName, branch: branchName, soldAt: payload.data.soldAt ?? new Date().toISOString(),
      };
      setReceipt(soldReceipt);
      clearCart(); setCustomerId("");
      toast.success(`Sale ${payload.data.reference} completed.`);
      if (options.print) printReceipt(soldReceipt);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sale could not be completed.");
    } finally { setBusy(false); }
  }

  function printReceipt(target?: Receipt) {
    if (!target && !receipt) { toast.error("Complete a sale before printing a receipt."); return; }
    const sold: Receipt = target ?? (receipt as Receipt);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${sold.reference}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827;max-width:720px;margin:0 auto}h1{margin:0 0 4px;font-size:22px}.muted{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px 6px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:13px}th{color:#475569;font-weight:600}.right{text-align:right}.totals{margin-top:18px;max-width:320px;margin-left:auto;font-size:14px}.row{display:flex;justify-content:space-between;padding:4px 0}.total{font-weight:700;font-size:16px;border-top:1px solid #e5e7eb;margin-top:8px;padding-top:10px}</style></head><body><h1>${escapeHtml(business.name)}</h1><div class="muted">${escapeHtml(business.address || "")}</div><div class="muted">${escapeHtml(business.phone || "")}</div><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/><div><strong>Receipt:</strong> ${escapeHtml(sold.reference)}</div><div><strong>Date:</strong> ${new Date(sold.soldAt).toLocaleString()}</div><div><strong>Branch:</strong> ${escapeHtml(sold.branch)}</div><div><strong>Customer:</strong> ${escapeHtml(sold.customer)}</div><div><strong>Payment:</strong> ${sold.paymentMethod.toUpperCase()}</div><table><thead><tr><th>Medicine</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${sold.items.map((i) => `<tr><td>${escapeHtml(i.name)}</td><td class="right">${i.quantity}</td><td class="right">${money(i.unitPrice)}</td><td class="right">${money(i.lineTotal)}</td></tr>`).join("")}</tbody></table><div class="totals"><div class="row"><span>Subtotal</span><span>${money(sold.subtotal)}</span></div><div class="row"><span>Discount</span><span>-${money(sold.discount)}</span></div><div class="row"><span>Tax</span><span>${money(sold.tax)}</span></div><div class="row total"><span>Grand Total</span><span>${money(sold.total)}</span></div>${sold.paymentMethod === "cash" ? `<div class="row"><span>Cash received</span><span>${money(sold.amountTendered)}</span></div><div class="row"><span>Change</span><span>${money(sold.change)}</span></div>` : ""}</div><script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open("", "_blank", "width=760,height=900");
    if (!win) { toast.error("Allow pop-ups to print receipts."); return; }
    win.document.write(html); win.document.close();
  }

  const payBtn = (method: PaymentMethod, label: string, Icon: React.ElementType) => (
    <button type="button" onClick={() => setPaymentMethod(method)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${paymentMethod === method ? "border-[#16a34a] bg-[#f1fce0] text-[#14532d]" : "border-[#e5e7eb] bg-white text-slate-600 hover:bg-[#f8fafc]"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_420px]">
      <section className="space-y-4">
        <div className="surface-card p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto_auto]">
            <label className="field-label !mt-0">Branch
              <select className="input-control" value={branchId} onChange={(e) => { setBranchId(e.target.value); setCart([]); }}>
                <option value="" disabled>Choose branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="field-label !mt-0">Search medicine
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input ref={barcodeRef} className="input-control !pl-9" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onBarcodeSearch())} placeholder="Search by name, SKU, barcode, brand..." />
              </div>
            </label>
            <div className="flex items-end"><button type="button" className="button-secondary h-[46px] w-full gap-2" onClick={onBarcodeSearch}><ScanBarcode className="h-4 w-4" /> Find</button></div>
            <div className="flex items-end"><button type="button" className="button-secondary h-[46px] w-full gap-2 border-[#b7e532] bg-[#f7fde8] text-[#3f6212] hover:bg-[#ecfccb]" onClick={() => barcodeRef.current?.focus()} title="Focus search for barcode scanner input"><Barcode className="h-4 w-4" /> Scan</button></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === c ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#e5e7eb] bg-white text-slate-600 hover:border-[#cbd5e1] hover:bg-[#f8fafc]"}`}>{c}</button>
            ))}
          </div>
        </div>

        {heldOrders.length > 0 && (
          <div className="surface-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><PauseCircle className="h-4 w-4 text-[#16a34a]" /> Held orders</div>
            <div className="flex flex-wrap gap-2">
              {heldOrders.map((order) => (
                <button key={order.id} type="button" onClick={() => resumeHeld(order)} className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-left text-xs hover:border-[#16a34a] hover:bg-[#f7fde8]">
                  <div className="font-semibold text-slate-800">{order.label}</div>
                  <div className="mt-0.5 text-slate-500">{branches.find((b) => b.id === order.branchId)?.name ?? "Branch"}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="group flex flex-col rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#bbf7d0] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f8fafc] text-[#16a34a]">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Pill className="h-7 w-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.strength || item.brand || "Medicine"}{item.unit ? ` · ${item.unit}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#f1fce0] px-2 py-0.5 text-[11px] font-medium text-[#3f6212]">{item.category}</span>
                    <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-[#e5e7eb]">SKU {item.sku}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{money(item.price)}</p>
                  <p className={`mt-1 text-xs font-medium ${item.availableStock <= 0 ? "text-red-600" : item.availableStock <= 10 ? "text-amber-700" : "text-[#16a34a]"}`}>{item.availableStock} available</p>
                </div>
                <button type="button" className="button-primary !px-4 !py-2 !text-xs" onClick={() => add(item)} disabled={item.availableStock <= 0 || !branchId}>Add to cart</button>
              </div>
            </article>
          ))}
          {!filtered.length && (
            <div className="col-span-full rounded-[14px] border border-dashed border-[#e5e7eb] bg-white p-10 text-center">
              <Pill className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">No medicines found</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search, barcode, or category in the selected branch.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="flex h-fit flex-col rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.03)] xl:sticky xl:top-24">
        <div className="border-b border-[#e5e7eb] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><ShoppingCart className="h-5 w-5 text-[#16a34a]" /> Current order</h2>
              <p className="mt-1 text-xs text-slate-500">{cart.length} item{cart.length === 1 ? "" : "s"} · {branches.find((b) => b.id === branchId)?.name ?? "Select branch"}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <label className="field-label !mt-0 flex-1">Customer
              <select className="input-control" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
            </label>
            {canCreateCustomer && <button type="button" className="button-secondary mt-6 h-[46px] px-3" title="Add customer" onClick={createWalkInCustomer}><UserPlus className="h-4 w-4" /></button>}
          </div>
        </div>

        <div className="max-h-[340px] space-y-3 overflow-auto p-5">
          {cart.map((line) => (
            <div key={line.listingId} className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{line.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {line.strength || line.sku} · {money(line.price)} / {line.unit}
                    {line.packSize > 1 ? ` · ${line.packUnit ?? "Pack"} of ${line.packSize}` : ""}
                  </p>
                </div>
                <button type="button" className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-red-600" onClick={() => setCart((p) => p.filter((x) => x.listingId !== line.listingId))} aria-label="Remove item"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center rounded-xl border border-[#e5e7eb] bg-white">
                    <button type="button" className="p-2 text-slate-600 hover:text-slate-900" onClick={() => qty(line.listingId, line.quantity - 1)} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                    <input className="w-12 border-x border-[#e5e7eb] py-1.5 text-center text-sm font-medium text-slate-900 outline-none" value={line.quantity} onChange={(e) => qty(line.listingId, Number(e.target.value))} inputMode="numeric" />
                    <button type="button" className="p-2 text-slate-600 hover:text-slate-900" onClick={() => qty(line.listingId, line.quantity + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                  </div>
                  {line.packSize > 1 && (
                    <div className="inline-flex overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-[11px] font-semibold">
                      <button type="button" onClick={() => setSellUnit(line.listingId, "unit")} className={`px-2 py-1.5 ${line.sellUnit === "unit" ? "bg-[#16a34a] text-white" : "text-slate-600"}`}>{line.unit}</button>
                      <button type="button" onClick={() => setSellUnit(line.listingId, "pack")} className={`px-2 py-1.5 ${line.sellUnit === "pack" ? "bg-[#16a34a] text-white" : "text-slate-600"}`}>{line.packUnit ?? "Pack"}</button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{money(line.price * unitsPerLine(line))}</p>
                  <p className="text-[11px] text-slate-500">
                    max {line.sellUnit === "pack" ? `${maxQtyFor(line)} ${line.packUnit ?? "pack"}` : `${line.max} ${line.unit}`}
                    {line.sellUnit === "pack" ? ` · ${unitsPerLine(line)} ${line.unit}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!cart.length && (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8fafc] p-8 text-center">
              <ShoppingCart className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">Cart is empty</p>
              <p className="mt-1 text-xs text-slate-500">Select medicines from the catalog to build an order.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-[#e5e7eb] p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label !mt-0">Discount ({currency})<input className="input-control" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
            <label className="field-label !mt-0">Tax %<input className="input-control" type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Payment method</p>
            <div className="grid grid-cols-3 gap-2">
              {payBtn("cash", "Cash", Banknote)}
              {payBtn("card", "Card", CreditCard)}
              {payBtn("other", "Other", Wallet)}
            </div>
          </div>

          {paymentMethod === "cash" && (
            <label className="field-label !mt-0">Cash received ({currency})
              <input className="input-control" type="number" min="0" step="0.01" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} placeholder={total.toFixed(2)} />
            </label>
          )}

          <label className="field-label !mt-0">Notes<input className="input-control" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Optional order note" /></label>

          <div className="space-y-2 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{money(discountAmount)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax</span><span>{money(taxAmount)}</span></div>
            <div className="flex justify-between border-t border-[#e5e7eb] pt-2 text-base font-semibold text-slate-900"><span>Grand total</span><span>{money(total)}</span></div>
            {paymentMethod === "cash" && <div className="flex justify-between text-[#16a34a] font-medium"><span>Change</span><span>{money(change)}</span></div>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="button-secondary gap-2" onClick={hold} disabled={!cart.length || busy}><PauseCircle className="h-4 w-4" /> Hold order</button>
            <button type="button" className="button-secondary gap-2" onClick={clearCart} disabled={busy || !cart.length}><Trash2 className="h-4 w-4" /> Clear cart</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="button-secondary !py-3 gap-2 text-sm" onClick={() => void completeSale()} disabled={busy || !cart.length || !branchId}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Complete payment
            </button>
            <button type="button" className="button-primary !py-3 gap-2 text-sm" onClick={() => void completeSale({ print: true })} disabled={busy || !cart.length || !branchId}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Complete payment and print
            </button>
          </div>
          {receipt && (
            <div className="rounded-xl border border-[#bbf7d0] bg-[#f7fde8] p-3">
              <p className="text-sm font-semibold text-[#14532d]">Sale completed · {receipt.reference}</p>
              <p className="mt-1 text-xs text-slate-600">{receipt.paymentMethod.toUpperCase()} · {money(receipt.total)}{receipt.paymentMethod === "cash" ? ` · Change ${money(receipt.change)}` : ""}</p>
              <button type="button" className="button-secondary mt-3 w-full gap-2" onClick={() => printReceipt()}><Printer className="h-4 w-4" /> Print receipt</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
