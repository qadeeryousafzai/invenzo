"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

type Kind = "categories" | "customers" | "suppliers" | "expenses";
type Row = { id: string; name?: string; email?: string | null; phone?: string | null; description?: string | null; title?: string; category?: string; amount?: string | number; incurredAt?: string | Date; createdAt?: string | Date };
const config: Record<Kind, { title: string; endpoint: string; fields: string[]; label: string }> = {
  categories: { title: "Product categories", endpoint: "/api/categories", fields: ["name", "description"], label: "Category" },
  customers: { title: "Customers", endpoint: "/api/customers", fields: ["name", "email", "phone", "address", "notes"], label: "Customer" },
  suppliers: { title: "Suppliers", endpoint: "/api/suppliers", fields: ["name", "email", "phone", "address", "notes"], label: "Supplier" },
  expenses: { title: "Expenses", endpoint: "/api/expenses", fields: ["title", "category", "amount", "incurredAt", "notes"], label: "Expense" },
};

export function RecordsManager({ kind, rows, canCreate, currency = "USD" }: { kind: Kind; rows: Row[]; canCreate: boolean; currency?: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter(); const spec = config[kind];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const body: Record<string, string | number | undefined> = {};
    for (const key of spec.fields) { const value = values.get(key)?.toString().trim(); if (value) body[key] = key === "amount" ? Number(value) : key === "incurredAt" ? new Date(value).toISOString() : value; }
    setBusy(true); setError("");
    try { const response = await fetch(spec.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error ?? `${spec.label} could not be saved.`); toast.success(`${spec.label} saved`); form.reset(); router.refresh(); }
    catch (cause) { const message = cause instanceof Error ? cause.message : "Please try again."; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  const input = (key: string) => <label key={key} className="field-label">{({ name: "Name", email: "Email", phone: "Phone", address: "Address", notes: "Notes", description: "Description", title: "Expense name", category: "Category", amount: "Amount", incurredAt: "Date" } as Record<string, string>)[key]}{key === "notes" || key === "description" || key === "address" ? <textarea name={key} className="input-control min-h-20" maxLength={key === "description" ? 500 : 4000} /> : <input name={key} className="input-control" type={key === "email" ? "email" : key === "amount" ? "number" : key === "incurredAt" ? "date" : "text"} min={key === "amount" ? "0.01" : undefined} step={key === "amount" ? "0.01" : undefined} required={key === "name" || key === "title" || key === "category" || key === "amount"} maxLength={key === "phone" ? 40 : key === "email" ? 191 : 191} />}</label>;
  return <div className="space-y-6">
    {canCreate && <section className="surface-card p-5 sm:p-6"><p className="text-xs font-bold tracking-[.15em] text-black">WORKSPACE RECORDS</p><h2 className="mt-2 text-lg font-semibold text-black">Add {spec.label.toLowerCase()}</h2><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{spec.fields.map(input)}{error && <p role="alert" className="alert-error sm:col-span-2 xl:col-span-3">{error}</p>}<div className="sm:col-span-2 xl:col-span-3"><button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Save {spec.label.toLowerCase()}</button></div></form></section>}
    <section className="surface-card overflow-hidden"><div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-black">{spec.title}</h2><p className="mt-1 text-xs text-gray-600">Private to the active business workspace.</p></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-160 text-left text-sm"><thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500"><tr>{(kind === "expenses" ? ["Expense", "Category", "Amount", "Date"] : kind === "categories" ? ["Category", "Description", "Created"] : [spec.label, "Email", "Phone", "Created"]).map((item) => <th key={item} className="px-5 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id}>{kind === "expenses" ? <><td className="px-5 py-4 font-semibold text-black">{row.title}</td><td className="px-5 py-4 text-gray-600">{row.category}</td><td className="px-5 py-4 font-medium">{currency} {Number(row.amount).toFixed(2)}</td><td className="px-5 py-4 text-gray-600">{new Date(row.incurredAt ?? row.createdAt ?? Date.now()).toLocaleDateString()}</td></> : kind === "categories" ? <><td className="px-5 py-4 font-semibold text-black">{row.name}</td><td className="px-5 py-4 text-gray-600">{row.description || "—"}</td><td className="px-5 py-4 text-gray-600">{new Date(row.createdAt ?? Date.now()).toLocaleDateString()}</td></> : <><td className="px-5 py-4 font-semibold text-black">{row.name}</td><td className="px-5 py-4 text-gray-600">{row.email || "—"}</td><td className="px-5 py-4 text-gray-600">{row.phone || "—"}</td><td className="px-5 py-4 text-gray-600">{new Date(row.createdAt ?? Date.now()).toLocaleDateString()}</td></>}</tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center"><p className="font-semibold text-black">No {spec.title.toLowerCase()} yet</p><p className="mt-2 text-sm text-gray-600">Add your first record to start building your workspace data.</p></div>}</section>
  </div>;
}
