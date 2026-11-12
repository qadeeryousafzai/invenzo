"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Globe2, Loader2, PackagePlus, Search, X } from "lucide-react";
import { MedicineIllustration } from "@/components/medicine/MedicineIllustration";
import { encodeMedicineMeta } from "@/lib/medicine-meta";

type Branch = { id: string; name: string };

type CatalogMedicine = {
  id: string;
  canonicalKey: string;
  brandName: string | null;
  genericName: string | null;
  displayName: string;
  strengthText: string | null;
  dosageForm: string | null;
  route: string | null;
  atcCode: string | null;
  countryCode: string | null;
  regulatoryStatus: string | null;
  manufacturer: { name: string; countryCode: string | null } | null;
  source: { key: string; name: string; countryCode: string | null; attributionRequired: boolean };
  ingredients: { name: string; role: string | null; strengthText: string | null }[];
  identifiers: { system: string; value: string }[];
};

type CatalogResponse = {
  data: CatalogMedicine[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
};

const PAGE_SIZE = 24;

export function CatalogBrowser({ branches }: { branches: Branch[] }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [country, setCountry] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CatalogMedicine[]>([]);
  const [meta, setMeta] = useState<CatalogResponse["meta"]>({ page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogMedicine | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ branchId: branches[0]?.id ?? "", price: "", quantity: "0", sku: "" });

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
      const response = await fetch(`/api/catalog/medicines?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The catalog could not be searched.");
      setItems(payload.data ?? []);
      setMeta(payload.meta ?? { page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 1 });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The catalog could not be searched.");
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

  const openAdd = (medicine: CatalogMedicine) => {
    setSelected(medicine);
    setForm({
      branchId: branches[0]?.id ?? "",
      price: "",
      quantity: "0",
      sku: medicine.brandName ? `${medicine.brandName.slice(0, 8).toUpperCase()}-${medicine.strengthText ?? "GEN"}`.replace(/\s+/g, "-") : "",
    });
  };

  const submitAdd = async () => {
    if (!selected) return;
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a selling price.");
      return;
    }
    if (!form.branchId) {
      toast.error("Choose a branch.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.brandName || selected.genericName || selected.displayName,
          sku: form.sku || `CAT-${selected.id.slice(-8).toUpperCase()}`,
          brand: selected.manufacturer?.name ?? undefined,
          category: undefined,
          description: encodeMedicineMeta({
            dosageForm: selected.dosageForm,
            genericName: selected.genericName,
            strength: selected.strengthText,
            manufacturer: selected.manufacturer?.name,
          }),
          unit: "unit",
          branchId: form.branchId,
          price,
          initialQuantity: Number(form.quantity) || 0,
          catalogMedicineId: selected.id,
          marketplaceEnabled: false,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The medicine could not be added.");
      toast.success(`${selected.displayName} added to inventory.`);
      setSelected(null);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "The medicine could not be added.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <label className="flex-1 text-xs">
          <span className="text-slate-500">Search the global catalog</span>
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
        <label className="text-xs md:w-40">
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
        <label className="text-xs md:w-44">
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
      </div>

      {error ? <p className="surface-card p-4 text-sm text-rose-600">{error}</p> : null}

      <p className="text-xs text-slate-500">
        {loading ? "Searching…" : `${new Intl.NumberFormat("en-US").format(meta.total)} medicines in the catalog`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && items.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="surface-card h-32 animate-pulse bg-slate-50" />
            ))
          : items.map((medicine) => {
              return (
                <article key={medicine.id} className="surface-card flex flex-col gap-2 p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-50">
                      <MedicineIllustration
                        medicineName={medicine.brandName ?? medicine.genericName ?? medicine.displayName}
                        genericName={medicine.genericName}
                        strength={medicine.strengthText}
                        dosageForm={medicine.dosageForm}
                        size={40}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-950">{medicine.displayName}</h3>
                      <p className="truncate text-xs text-slate-500">{medicine.genericName ?? medicine.brandName ?? "—"}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {[medicine.strengthText, medicine.dosageForm, medicine.countryCode].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {medicine.manufacturer?.name ?? "Unknown manufacturer"} · {medicine.source.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => openAdd(medicine)}
                    disabled={!branches.length}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <PackagePlus size={13} /> Add to inventory
                  </button>
                </article>
              );
            })}
      </div>

      {!loading && items.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-slate-500">
          <Globe2 size={20} className="mx-auto mb-2 text-slate-400" />
          No catalog medicines match this search. Import a source from the super-admin catalog page first.
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

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="surface-card w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-950">{selected.displayName}</h2>
                <p className="truncate text-xs text-slate-500">
                  {[selected.genericName, selected.strengthText, selected.manufacturer?.name].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <label className="text-xs">
                <span className="text-slate-500">SKU</span>
                <input
                  value={form.sku}
                  onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>
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
              <label className="text-xs">
                <span className="text-slate-500">Opening stock</span>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Link href="/dashboard/products" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                Manage medicines
              </Link>
              <button
                type="button"
                onClick={() => void submitAdd()}
                disabled={saving || !branches.length}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <PackagePlus size={13} />}
                {saving ? "Adding…" : "Add to inventory"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}