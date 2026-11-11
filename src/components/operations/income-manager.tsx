"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Wallet, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type IncomeRow = { id: string; title: string; category: string; amount: string; paymentMethod: string | null; reference: string | null; notes: string | null; date: string; createdAt: string };

const METHODS = ["Cash", "Bank Transfer", "Card", "Cheque", "Mobile Payment", "Other"];

export function IncomeManager({ rows, canManage, currency = "USD" }: { rows: IncomeRow[]; canManage: boolean; currency?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IncomeRow | null>(null);
  const [query, setQuery] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const amount = Number(values.get("amount"));
    const title = values.get("title")?.toString().trim();
    const category = values.get("category")?.toString().trim();
    const paymentMethod = values.get("paymentMethod")?.toString().trim();
    const reference = values.get("reference")?.toString().trim();
    const notes = values.get("notes")?.toString().trim();
    const dateValue = values.get("date")?.toString().trim();
    if (!title || !category || !Number.isFinite(amount) || amount <= 0) { setError("Enter a title, category, and a positive amount."); return; }
    setBusy(true); setError("");
    const body = { title, category, amount, ...(paymentMethod ? { paymentMethod } : {}), ...(reference ? { reference } : {}), ...(notes ? { notes } : {}), ...(dateValue ? { date: new Date(`${dateValue}T12:00:00`).toISOString() } : {}) };
    try {
      if (editing) {
        const response = await fetch(`/api/income/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Income could not be updated.");
        toast.success("Income updated");
      } else {
        const response = await fetch("/api/income", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Income could not be saved.");
        toast.success("Income saved");
        form.reset();
      }
      setShowForm(false); setEditing(null); router.refresh();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Please try again."; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }

  async function remove(row: IncomeRow) {
    if (!window.confirm(`Delete income "${row.title}"?`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/income/${row.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Income could not be deleted.");
      toast.success("Income deleted");
      router.refresh();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Please try again."; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }

  function startEdit(row: IncomeRow) { setEditing(row); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startCreate() { setEditing(null); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const filtered = query ? rows.filter((row) => `${row.title} ${row.category} ${row.paymentMethod ?? ""} ${row.reference ?? ""}`.toLowerCase().includes(query.toLowerCase())) : rows;
  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const thisMonth = rows.filter((row) => { const d = new Date(row.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthTotal = thisMonth.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Total income</p><p className="mt-2 text-2xl font-semibold text-slate-900">{money(total)}</p><p className="mt-1 text-xs text-slate-500">Across {rows.length} entr{rows.length === 1 ? "y" : "ies"}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">This month</p><p className="mt-2 text-2xl font-semibold text-[#16a34a]">{money(monthTotal)}</p><p className="mt-1 text-xs text-slate-500">{thisMonth.length} entr{thisMonth.length === 1 ? "y" : "ies"} recorded</p></div>
        <div className="surface-card p-5"><p className="text-xs font-medium text-slate-500">Categories</p><p className="mt-2 text-2xl font-semibold text-slate-900">{new Set(rows.map((row) => row.category)).size}</p><p className="mt-1 text-xs text-slate-500">Distinct income categories</p></div>
      </section>

      {canManage && showForm && (
        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Wallet className="h-5 w-5 text-[#16a34a]" />{editing ? "Edit income" : "Record income"}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(""); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="field-label">Title<input name="title" className="input-control" required maxLength={191} defaultValue={editing?.title} placeholder="e.g. Consultation income" /></label>
            <label className="field-label">Category<input name="category" className="input-control" required maxLength={120} defaultValue={editing?.category} placeholder="e.g. Services" /></label>
            <label className="field-label">Amount<input name="amount" className="input-control" type="number" min="0.01" step="0.01" required defaultValue={editing ? Number(editing.amount) : undefined} placeholder="0.00" /></label>
            <label className="field-label">Payment method<select name="paymentMethod" className="input-control" defaultValue={editing?.paymentMethod ?? "Cash"}>{METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
            <label className="field-label">Reference<input name="reference" className="input-control" maxLength={191} defaultValue={editing?.reference ?? undefined} placeholder="Optional" /></label>
            <label className="field-label">Date<input name="date" className="input-control" type="date" defaultValue={editing ? new Date(editing.date).toISOString().slice(0, 10) : undefined} /></label>
            <label className="field-label sm:col-span-2 xl:col-span-3">Notes<textarea name="notes" className="input-control min-h-20" maxLength={4000} defaultValue={editing?.notes ?? undefined} /></label>
            {error && <p role="alert" className="alert-error sm:col-span-2 xl:col-span-3">{error}</p>}
            <div className="flex gap-2 sm:col-span-2 xl:col-span-3">
              <button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}{editing ? "Save changes" : "Record income"}</button>
              <button type="button" className="button-secondary" onClick={() => { setShowForm(false); setEditing(null); setError(""); }}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {canManage && !showForm && (
        <div className="flex justify-end">
          <button type="button" className="button-primary" onClick={startCreate}><Plus className="h-4 w-4" /> Record income</button>
        </div>
      )}

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-slate-900">Income entries</h2><p className="mt-1 text-xs text-slate-500">All recorded income for this workspace.</p></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search income…" className="input-control max-w-xs" />
        </div>
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">Title</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Method</th><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Amount</th>{canManage && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.title}</td>
                    <td className="px-5 py-4 text-slate-600">{row.category}</td>
                    <td className="px-5 py-4 text-slate-600">{row.paymentMethod ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{row.reference ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right font-semibold text-[#16a34a]">{money(Number(row.amount))}</td>
                    {canManage && <td className="px-5 py-4"><div className="flex items-center justify-end gap-1"><button type="button" onClick={() => startEdit(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-[#f1f7ee] hover:text-[#16a34a]" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(row)} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Wallet className="mx-auto h-10 w-10 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-slate-900">{rows.length ? "No matching income" : "No income recorded yet"}</p>
            <p className="mt-2 text-sm text-slate-500">{rows.length ? "Try a different search." : "Record your first income entry to start tracking revenue."}</p>
            {!rows.length && canManage && <button type="button" onClick={startCreate} className="button-primary mt-4"><Plus className="h-4 w-4" /> Record income</button>}
          </div>
        )}
      </section>
    </div>
  );
}