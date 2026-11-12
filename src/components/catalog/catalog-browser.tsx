"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Loader2, PackagePlus, Search, X } from "lucide-react";
import { MedicineIllustration } from "@/components/medicine/MedicineIllustration";

type Branch = { id: string; name: string };

type MedicineRow = {
  key: string;
  source: "catalog" | "product";
  catalogMedicineId: string | null;
  productId: string | null;
  listingId: string | null;
  branchId: string | null;
  name: string;
  genericName: string | null;
  brandName: string | null;
  strengthText: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  countryCode: string | null;
  sourceName: string;
  unit: string;
  stock: number;
  batchCount: number;
  nearestExpiry: string | null;
  stocked: boolean;
};

type ListResponse = {
  data: MedicineRow[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
};

type StockFilter = "all" | "in" | "out";

const PAGE_SIZE = 24;

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function daysUntil(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function CatalogBrowser({ branches }: { branches: Branch[] }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [country, setCountry] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MedicineRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"]>({ page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ row: MedicineRow; mode: "stock" | "new" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ branchId: "", quantity: "", batchNumber: "", expiry: "", price: "", name: "", packSize: "1", packUnit: "" });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debounced) params.set("q", debounced);
      if (country) params.set("country", country);
      if (dosageForm) params.set("dosageForm", dosageForm);
      const response = await fetch(`/api/inventory/catalog-medicines?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The medicine list could not be loaded.");
      setItems(payload.data ?? []);
      setMeta(payload.meta ?? { page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 1 });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The medicine list could not be loaded.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, debounced, country, dosageForm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.countryCode) set.add(item.countryCode);
    return Array.from(set);
  }, [items]);

  const dosageForms = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.dosageForm) set.add(item.dosageForm);
    return Array.from(set).sort();
  }, [items]);

  const visible = useMemo(() => {
    if (stockFilter === "in") return items.filter((item) => item.stock > 0);
    if (stockFilter === "out") return items.filter((item) => item.stock <= 0);
    return items;
  }, [items, stockFilter]);

  const stats = useMemo(() => {
    const stocked = items.filter((item) => item.stock > 0).length;
    const expiring = items.filter((item) => {
      const days = daysUntil(item.nearestExpiry);
      return days !== null && days <= 90;
    }).length;
    return { total: meta.total, stocked, expiring };
  }, [items, meta.total]);

  const openDialog = (row: MedicineRow) => {
    setDialog({ row, mode: row.stocked ? "stock" : "new" });
    setForm({
      branchId: row.branchId ?? branches[0]?.id ?? "",
      quantity: "",
      batchNumber: "",
      expiry: "",
      price: "",
      name: row.name,
      packSize: "1",
      packUnit: "",
    });
  };

  const submit = async () => {
    if (!dialog) return;
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }

    setSaving(true);
    try {
      if (dialog.mode === "stock" && dialog.row.listingId) {
        const response = await fetch("/api/inventory/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productListingId: dialog.row.listingId,
            quantityChange: quantity,
            note: `Stock received for ${dialog.row.name}`,
            batchNumber: form.batchNumber.trim() || undefined,
            expiryDate: form.expiry ? new Date(`${form.expiry}T00:00:00.000Z`).toISOString() : undefined,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Stock could not be added.");
        toast.success(`Added ${formatQty(quantity)} ${dialog.row.unit} to ${dialog.row.name}.`);
      } else {
        const price = Number(form.price);
        if (!Number.isFinite(price) || price <= 0) {
          toast.error("Enter a selling price for the new medicine.");
          return;
        }
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim() || dialog.row.name,
            sku: `CAT-${dialog.row.catalogMedicineId?.slice(-8).toUpperCase() ?? Date.now().toString(36).toUpperCase()}`,
            packSize: Math.max(1, Number(form.packSize) || 1),
            packUnit: form.packUnit.trim() || undefined,
            brand: dialog.row.manufacturer ?? undefined,
            description: [dialog.row.genericName, dialog.row.strengthText, dialog.row.manufacturer].filter(Boolean).join(" · ") || undefined,
            unit: dialog.row.unit || "unit",
            branchId: form.branchId,
            price,
            initialQuantity: quantity,
            batchNumber: form.batchNumber.trim() || undefined,
            expiryDate: form.expiry ? new Date(`${form.expiry}T00:00:00.000Z`).toISOString() : undefined,
            catalogMedicineId: dialog.row.catalogMedicineId ?? undefined,
            marketplaceEnabled: false,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "The medicine could not be added.");
        toast.success(`${dialog.row.name} added to your inventory.`);
      }
      setDialog(null);
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "The change could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="surface-card flex items-center gap-3 p-3">
          <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <PackagePlus size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Medicines in catalog</p>
            <p className="text-lg font-semibold text-slate-950">{new Intl.NumberFormat("en-US").format(stats.total)}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-3">
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <PackagePlus size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">In your stock (this page)</p>
            <p className="text-lg font-semibold text-slate-950">{stats.stocked}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-3">
          <span className="grid size-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Expiring within 90 days</p>
            <p className="text-lg font-semibold text-slate-950">{stats.expiring}</p>
          </div>
        </article>
      </div>

      <div className="surface-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <label className="flex-1 text-xs">
          <span className="text-slate-500">Search all medicines</span>
          <div className="relative mt-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Brand, generic name, strength or manufacturer"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            ) : null}
          </div>
        </label>
        <label className="text-xs lg:w-36">
          <span className="text-slate-500">Country</span>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setPage(1);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
          >
            <option value="">Any</option>
            {countries.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs lg:w-44">
          <span className="text-slate-500">Dosage form</span>
          <select
            value={dosageForm}
            onChange={(event) => {
              setDosageForm(event.target.value);
              setPage(1);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
          >
            <option value="">Any</option>
            {dosageForms.map((form) => (
              <option key={form} value={form}>
                {form}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs lg:w-40">
          <span className="text-slate-500">Stock (this page)</span>
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as StockFilter)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
          >
            <option value="all">All medicines</option>
            <option value="in">In stock only</option>
            <option value="out">Out of stock (0)</option>
          </select>
        </label>
      </div>

      {error ? <p className="surface-card p-4 text-sm text-rose-600">{error}</p> : null}

      <p className="text-xs text-slate-500">
        {loading ? "Loading…" : `${new Intl.NumberFormat("en-US").format(stats.total)} medicines · page ${meta.page} of ${meta.pageCount}`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && items.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="surface-card h-40 animate-pulse bg-slate-50" />)
          : visible.map((row) => {
              const days = daysUntil(row.nearestExpiry);
              return (
                <article key={row.key} className="surface-card flex flex-col gap-2 p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-50">
                      <MedicineIllustration
                        medicineName={row.brandName ?? row.genericName ?? row.name}
                        genericName={row.genericName}
                        strength={row.strengthText}
                        dosageForm={row.dosageForm}
                        size={40}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-950">{row.name}</h3>
                      <p className="truncate text-xs text-slate-500">{row.genericName ?? row.brandName ?? "—"}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {[row.strengthText, row.dosageForm, row.countryCode].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">In stock</p>
                      <p className={`text-sm font-semibold ${row.stock > 0 ? "text-slate-950" : "text-slate-400"}`}>
                        {formatQty(row.stock)} <span className="text-[11px] font-normal text-slate-500">{row.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                        <CalendarClock size={11} /> Nearest expiry
                      </p>
                      <p
                        className={`text-[11px] font-medium ${
                          days === null ? "text-slate-400" : days <= 90 ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        {formatDate(row.nearestExpiry) ?? "—"}
                        {days !== null ? ` (${days} d)` : ""}
                      </p>
                    </div>
                  </div>

                  <p className="truncate text-[11px] text-slate-500">
                    {row.manufacturer ?? "Unknown manufacturer"} · {row.sourceName}
                  </p>

                  <button
                    type="button"
                    onClick={() => openDialog(row)}
                    disabled={!branches.length}
                    className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      row.stocked
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <PackagePlus size={13} /> {row.stocked ? "Add stock" : "Add to inventory"}
                  </button>
                </article>
              );
            })}
      </div>

      {!loading && visible.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-slate-500">
          No medicines match this search. Try a different name or clear the stock filter.
        </p>
      ) : null}

      {meta.pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {meta.page} of {meta.pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(value + 1, meta.pageCount))}
            disabled={page >= meta.pageCount}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {dialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="surface-card w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-950">{dialog.row.name}</h2>
                <p className="truncate text-xs text-slate-500">
                  {[dialog.row.genericName, dialog.row.strengthText].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button type="button" onClick={() => setDialog(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {dialog.mode === "stock"
                ? `Currently ${formatQty(dialog.row.stock)} ${dialog.row.unit} across ${dialog.row.batchCount} batch(es).`
                : "This medicine is not in your inventory yet. Adding it creates a product with this opening stock."}
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {dialog.mode === "new" ? (
                <label className="text-xs sm:col-span-2">
                  <span className="text-slate-500">Medicine name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                  />
                </label>
              ) : null}

              {dialog.mode === "new" ? (
                <label className="text-xs">
                  <span className="text-slate-500">Branch</span>
                  <select
                    value={form.branchId}
                    onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="text-xs">
                <span className="text-slate-500">Quantity received</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>

              {dialog.mode === "new" ? (
                <label className="text-xs">
                  <span className="text-slate-500">Selling price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                  />
                </label>
              ) : null}

              <label className="text-xs">
                <span className="text-slate-500">Pack size (units per pack)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.packSize}
                  onChange={(event) => setForm((prev) => ({ ...prev, packSize: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>

              <label className="text-xs">
                <span className="text-slate-500">Pack name (e.g. Box, Strip)</span>
                <input
                  value={form.packUnit}
                  onChange={(event) => setForm((prev) => ({ ...prev, packUnit: event.target.value }))}
                  placeholder="Box"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>

              <label className="text-xs">
                <span className="text-slate-500">Batch number</span>
                <input
                  value={form.batchNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, batchNumber: event.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>

              <label className="text-xs">
                <span className="text-slate-500">Expiry date</span>
                <input
                  type="date"
                  value={form.expiry}
                  onChange={(event) => setForm((prev) => ({ ...prev, expiry: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving || !branches.length}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <PackagePlus size={13} />}
                {saving ? "Saving…" : dialog.mode === "stock" ? "Add stock" : "Add medicine"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}