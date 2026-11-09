"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Plus, Minus, Trash2, Printer, AlertTriangle } from "lucide-react";
import { createPosSale, getPosBranches, getPosBusinesses, getPosNearExpiry, getPosProducts } from "@/app/super-admin/actions";
import { toast } from "sonner";

type Product = {
  id: string;
  price: unknown;
  product: { id: string; name: string; sku: string | null; barcode: string | null; unit: string };
  batches: Array<{ id: string; batchNumber: string; expiryDate: Date | null; quantityRemaining: unknown }>;
};

type CartItem = {
  productListingId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
};

export function PosBilling() {
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; type: string; currency: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSale, setLastSale] = useState<{ reference: string; total: number; items: CartItem[]; customerName: string | null } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [nearExpiry, setNearExpiry] = useState<Array<{ name: string; batch: string; remaining: number; expiry: string }>>([]);
  const currency = businesses.find((b) => b.id === selectedBusinessId)?.currency ?? "USD";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPosBusinesses();
        if (!cancelled) setBusinesses(data);
      } catch {
        if (!cancelled) setBusinesses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBusinessId) { if (!cancelled) setNearExpiry([]); return; }
      try {
        const data = await getPosNearExpiry(selectedBusinessId);
        if (!cancelled) setNearExpiry(data.map((batch) => ({
          name: batch.listing.product.name,
          batch: batch.batchNumber,
          remaining: Math.floor(Number(batch.quantityRemaining)),
          expiry: batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—",
        })));
      } catch {
        if (!cancelled) setNearExpiry([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBusinessId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBusinessId) { if (!cancelled) setBranches([]); return; }
      try {
        const branchList = await getPosBranches(selectedBusinessId);
        if (!cancelled) {
          setBranches(branchList);
          if (branchList[0]) setSelectedBranchId(branchList[0].id);
        }
      } catch {
        if (!cancelled) setBranches([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBusinessId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBusinessId || !selectedBranchId) { if (!cancelled) setProducts([]); return; }
      try {
        const data = await getPosProducts(selectedBusinessId, selectedBranchId, search);
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBusinessId, selectedBranchId, search]);

  const addToCart = useCallback((product: Product, unitPrice: number) => {
    const batch = product.batches[0];
    if (!batch) return;
    const available = Math.floor(Number(batch.quantityRemaining));
    setCart((prev) => {
      const existing = prev.find((item) => item.batchId === batch.id);
      if (existing) {
        if (existing.quantity + 1 > available) return prev;
        return prev.map((item) => (item.batchId === batch.id ? { ...existing, quantity: existing.quantity + 1 } : item));
      }
      return [
        ...prev,
        {
          productListingId: product.id,
          productName: product.product.name,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : null,
          unit: product.product.unit,
          quantity: 1,
          unitPrice,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((batchId: string, quantity: number) => {
    if (quantity < 1) return;
    const batch = products.flatMap((p) => p.batches.find((b) => b.id === batchId));
    const target = batch[0];
      if (target && quantity > Number(target.quantityRemaining)) return;
    setCart((prev) => prev.map((item) => (item.batchId === batchId ? { ...item, quantity } : item)));
  }, [products]);

  const removeFromCart = useCallback((batchId: string) => {
    setCart((prev) => prev.filter((item) => item.batchId !== batchId));
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSale = async () => {
    if (!selectedBusinessId || !selectedBranchId || !cart.length) return;
    setBusy(true);
    try {
      const result = await createPosSale(
        Object.assign(new FormData(), {
          businessId: selectedBusinessId,
          branchId: selectedBranchId,
          customerName,
          items: JSON.stringify(cart.map(({ productListingId, batchId, quantity, unitPrice }) => ({ productListingId, inventoryBatchId: batchId, quantity, unitPrice }))),
        })
      );
      if (!result.ok) { toast.error(result.error ?? "Sale failed."); return; }
      setLastSale({ reference: String(result.reference), total: result.total ?? subtotal, items: [...cart], customerName: customerName || null });
      setCart([]);
      setCustomerName("");
      const data = await getPosProducts(selectedBusinessId, selectedBranchId, search);
      setProducts(data);
      toast.success(`Sale billed · ${result.reference}`);
    } catch {
      toast.error("Sale could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const printReceipt = () => {
    if (!lastSale || !printRef.current) return;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    const itemsHtml = lastSale.items
      .map(
        (item) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #ddd">${item.productName}</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${item.quantity} × ${item.unitPrice.toFixed(2)}</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${(item.unitPrice * item.quantity).toFixed(2)}</td></tr>`
      )
      .join("");
    const html = `
      <html><head><style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:#111;padding:16px}
        .header{text-align:center;border-bottom:2px solid #175b45;padding-bottom:10px;margin-bottom:14px}
        .header h1{margin:0;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:#175b45}
        table{width:100%;border-collapse:collapse;margin-bottom:14px}
        .total{text-align:right;font-size:15px;font-weight:700;border-top:2px solid #111;padding-top:8px}
        .meta{font-size:11px;color:#555;margin-bottom:10px}
        .foot{margin-top:14px;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px;text-align:center}
      </style></head><body>
        <div class="header"><h1>INVENZO</h1><div class="meta">Point of Sale · Receipt ${lastSale.reference}</div></div>
        <table><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd">Item</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd">Qty × Price</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <div class="total">Total: ${currency} ${lastSale.total.toFixed(2)}</div>
        <div class="meta">${lastSale.customerName ? `Customer: ${lastSale.customerName}<br>` : ""}Thank you for your purchase.</div>
        <div class="foot">This is a computer-generated receipt.</div>
        <script>window.print();setTimeout(()=>window.close(),500);</script>
      </body></html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.15em] text-slate-500">POINT OF SALE</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Billing &amp; POS Print</h1>
          <p className="mt-1 text-sm text-slate-500">Bill medicines for walk-in customers, print receipts, and deduct stock in real time.</p>
        </div>
        {lastSale && (
          <div className="flex items-center gap-2">
            <button onClick={printReceipt} className="bg-[#175b45] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition">
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        )}
      </div>

      {nearExpiry.length > 0 && (
        <article className="border border-amber-100 bg-amber-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Medicines near expiry</h3>
              <p className="text-sm text-amber-800">
                {nearExpiry.map((item) => `${item.name} (batch ${item.batch}, ${item.remaining} left, expires ${item.expiry})`).join("; ")}
              </p>
            </div>
          </div>
        </article>
      )}

      <div className="grid gap-4 sm:grid-cols-12">
        <div className="sm:col-span-4 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</label>
            <select
              value={selectedBusinessId}
              onChange={(event) => { setSelectedBusinessId(event.target.value); setSelectedBranchId(""); }}
              className="input-control w-full"
              disabled={busy}
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} · {business.type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</label>
            <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)} className="input-control w-full" disabled={busy || !selectedBusinessId}>
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer (optional)</label>
            <input className="input-control w-full" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Walk-in customer name" />
          </div>
        </div>

        <div className="sm:col-span-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400 size-5" />
            <input
              className="input-control w-full pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medicine by name, SKU, or barcode"
            />
          </div>
          <article className="surface-card p-3 max-h-[340px] overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400">
                  <th className="text-left pb-2">Medicine</th>
                  <th className="text-right pb-2 pr-2">Batch</th>
                  <th className="text-right pb-2 pr-2">Expiry</th>
                  <th className="text-right pb-2 pr-2">Stock</th>
                  <th className="text-right pb-2 pr-2">Price</th>
                  <th className="pb-2 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const batch = product.batches[0];
                  return (
                    <tr key={product.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 text-slate-600">{product.product.name}</td>
                      <td className="py-2 text-right pr-2 font-mono text-xs text-slate-500">{batch?.batchNumber ?? "—"}</td>
                      <td className="py-2 text-right pr-2 font-mono text-xs text-slate-500">{batch?.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—"}</td>
                      <td className="py-2 text-right pr-2 font-mono text-xs text-slate-500">{batch ? Math.floor(Number(batch.quantityRemaining)) : 0}</td>
                      <td className="py-2 text-right pr-2 font-mono text-xs text-slate-500">{currency} {Number(product.price).toFixed(2)}</td>
                      <td className="py-2 text-right pr-2">
                        {batch && Number(batch.quantityRemaining) > 0 ? (
                          <button
                            onClick={() => addToCart(product, Number(String(product.price)))}
                            disabled={!batch || Number(batch.quantityRemaining) === 0}
                            className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition bg-[#175b45] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600"
                          >
                            <Plus size={12} /> Add
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Out of stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && search && (
                  <tr><td colSpan={6} className="py-4 text-center text-sm text-slate-500">No medicines found.</td></tr>
                )}
                {products.length === 0 && !search && !selectedBranchId && (
                  <tr><td colSpan={6} className="py-4 text-center text-sm text-slate-500">Select a business and branch to stock medicines.</td></tr>
                )}
              </tbody>
            </table>
          </article>
        </div>

        <div className="sm:col-span-4 space-y-3">
          <article className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Bill</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POS</span>
            </div>
            <div className="space-y-3">
              {cart.length ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-right pb-2 pr-2">Qty</th>
                      <th className="text-right pb-2 pr-2">Price</th>
                      <th className="text-right pb-2 pr-2">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.batchId} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600 text-sm">{item.productName}<br /><span className="text-[10px] text-slate-400">batch {item.batchNumber} · {item.expiryDate ?? "n/a"}</span></td>
                        <td className="py-2 text-right pr-2 text-sm">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setQuantity(item.batchId, Math.max(1, item.quantity - 1))} className="rounded p-1 text-slate-400 hover:text-slate-900"><Minus size={14} /></button>
                            {item.quantity}
                            <button onClick={() => setQuantity(item.batchId, item.quantity + 1)} className="rounded p-1 text-slate-400 hover:text-slate-900"><Plus size={14} /></button>
                          </div>
                        </td>
                        <td className="py-2 text-right pr-2 text-sm font-mono">{currency} {item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right pr-2 text-sm font-semibold font-mono">{currency} {(item.unitPrice * item.quantity).toFixed(2)}</td>
                        <td className="py-2"><button onClick={() => removeFromCart(item.batchId)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-12 flex items-center justify-center text-sm text-slate-400">No items billed yet.</div>
              )}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-mono font-bold text-lg text-[#175b45]">{currency} {subtotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleSale}
              disabled={busy || !cart.length || !selectedBranchId}
              className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${busy || !cart.length || !selectedBranchId ? "bg-slate-200 text-slate-400" : "bg-[#175b45] text-white hover:bg-emerald-600"}`}
            >
              {busy ? "Billing…" : "Bill &amp; Print Receipt"}
            </button>
            {cart.length > 0 && !busy && (
              <p className="text-[11px] text-slate-500">Stock is deducted from the nearest-expiry batch first (FIFO).</p>
            )}
          </article>
        </div>
      </div>

      <div ref={printRef} className="hidden" />
    </div>
  );
}
