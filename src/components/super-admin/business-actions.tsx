"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, CalendarClock, Check, LoaderCircle, RotateCcw, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceAccessStatus } from "@/modules/businesses/subscription";

type Props = { businessId: string; businessName: string; status: WorkspaceAccessStatus; statusUntil: string | null };

export function BusinessActions({ businessId, businessName, status, statusUntil }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>, action: string, endpoint = "management") {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload: Record<string, string | number> = { action };
    if (reason.trim()) payload.reason = reason.trim();
    if (action === "temporarily_block" && durationDays) payload.durationDays = Number(durationDays);
    if (["reactivate", "extend_expiry"].includes(action) && expiryDate) payload.expiresAt = new Date(`${expiryDate}T23:59:59`).toISOString();
    if (action === "delete") payload.confirmation = confirmation;
    try {
      const response = await fetch(`/api/super-admin/businesses/${businessId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.error ?? "The business account could not be updated.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(action === "approve" ? "Business account approved." : action === "reject" ? "Application rejected." : action === "suspend" ? "Business suspended." : action === "temporarily_block" ? "Business temporarily blocked." : action === "reactivate" ? "Business account reactivated." : action === "extend_expiry" ? "Account expiry extended." : action === "restore" ? "Business workspace restored." : action === "delete" ? "Business and data permanently deleted." : "Business workspace soft deleted; data retained.");
      setReason("");
      setDurationDays("");
      setExpiryDate("");
      setConfirmation("");
      router.refresh();
    } catch {
      const message = "The business account could not be updated. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const confirmRestricted = (label: string) => window.confirm(`${label} ${businessName}? This immediately changes business access.`);

  return <section className="surface-card p-5 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Account actions</h2><p className="mt-1 text-xs leading-5 text-slate-500">Actions are recorded with the administrator, previous state, reason, and time.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{status.toLowerCase().replaceAll("_", " ")}</span></div>

    {status === "PENDING_APPROVAL" && <div className="grid gap-3 sm:grid-cols-2">
      <form onSubmit={(event) => void submit(event, "approve", "verification")}><button className="button-primary w-full" disabled={busy} onClick={(event) => { if (!window.confirm(`Approve ${businessName} and activate access?`)) event.preventDefault(); }} type="submit">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} Approve application</button></form>
      <form onSubmit={(event) => void submit(event, "reject", "verification")} className="space-y-2 sm:col-span-2"><label className="field-label">Rejection reason<textarea className="input-control min-h-20 resize-y" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Explain why this application cannot be approved" required /></label><button className="button-secondary inline-flex items-center gap-2 text-red-700" type="submit" disabled={busy || !reason.trim()}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />} Reject application</button></form>
    </div>}

    {(status === "ACTIVE" || status === "EXPIRED" || status === "SUSPENDED" || status === "TEMPORARILY_BLOCKED") && <div className="space-y-4">
      {(status === "ACTIVE" || status === "EXPIRED") && <form onSubmit={(event) => void submit(event, "renew", "verification")} className="flex flex-wrap items-end gap-3"><div className="flex-1"><p className="text-xs font-semibold text-slate-700">Add the configured access period</p><p className="mt-1 text-[11px] text-slate-500">Default duration comes from platform settings.</p></div><button className="button-secondary inline-flex items-center gap-2 text-emerald-800" disabled={busy}><CalendarClock size={14} /> {status === "EXPIRED" ? "Reactivate for default period" : "Extend by default period"}</button></form>}

      {(status === "EXPIRED" || status === "SUSPENDED" || status === "TEMPORARILY_BLOCKED") && <form onSubmit={(event) => void submit(event, "reactivate")} className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"><div><h3 className="text-xs font-semibold text-emerald-950">Reactivate existing business</h3><p className="mt-1 text-[11px] leading-5 text-emerald-900/70">Keeps the business and owner IDs and all stored history. Set an expiry date or leave it blank to preserve a future expiry or use the configured duration.</p></div><label className="field-label">New expiry date <span className="font-normal text-slate-400">(optional)</span><input className="input-control" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></label><label className="field-label">Reactivation reason <span className="font-normal text-slate-400">(optional)</span><input className="input-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} /></label><button className="button-primary" disabled={busy} onClick={(event) => { if (!confirmRestricted("Reactivate")) event.preventDefault(); }}><RotateCcw size={14} /> Reactivate account</button></form>}

      <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <form onSubmit={(event) => { if (!confirmRestricted("Suspend access for")) { event.preventDefault(); return; } void submit(event, "suspend"); }} className="space-y-2"><label className="field-label">Suspension reason<input className="input-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Required" /></label><button className="button-secondary inline-flex items-center gap-2" disabled={busy || !reason.trim()}><ShieldAlert size={14} /> Suspend indefinitely</button></form>
        <form onSubmit={(event) => { if (!confirmRestricted("Temporarily block access for")) { event.preventDefault(); return; } void submit(event, "temporarily_block"); }} className="space-y-2"><label className="field-label">Temporary block reason<input className="input-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Required" /></label><label className="field-label">Duration in days <span className="font-normal text-slate-400">(optional)</span><input className="input-control" type="number" min={1} max={3650} value={durationDays} onChange={(event) => setDurationDays(event.target.value)} placeholder="Until manually restored" /></label><button className="button-secondary inline-flex items-center gap-2" disabled={busy || !reason.trim()}><Ban size={14} /> Temporarily block</button></form>
      </div>

      {statusUntil && status === "TEMPORARILY_BLOCKED" && <p className="text-xs text-orange-800">Automatic restoration is scheduled for {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(statusUntil))}.</p>}
    </div>}

    {status === "REJECTED" && <p className="text-xs leading-5 text-slate-600">This application is rejected. Dashboard access remains blocked. The applicant can contact the platform administrator to discuss the decision.</p>}

    <div className="mt-5 border-t border-slate-100 pt-4">
      {status !== "DELETED" ? <form onSubmit={(event) => { if (!confirmRestricted("Soft delete")) { event.preventDefault(); return; } void submit(event, "soft_delete"); }} className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="field-label flex-1">Deletion reason <span className="font-normal text-slate-400">(optional)</span><input className="input-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} /></label><button className="button-secondary inline-flex items-center gap-2 text-slate-700" disabled={busy}><Archive size={14} /> Soft delete · retain data</button></form> : <div className="space-y-4"><form onSubmit={(event) => { if (!window.confirm(`Restore ${businessName} with its saved account state?`)) { event.preventDefault(); return; } void submit(event, "restore"); }}><button className="button-secondary inline-flex items-center gap-2" disabled={busy}><RotateCcw size={14} /> Restore workspace</button></form><form onSubmit={(event) => { if (!window.confirm(`Permanently delete ${businessName} and all business data? This cannot be undone.`)) { event.preventDefault(); return; } void submit(event, "delete"); }} className="rounded-xl border border-red-100 bg-red-50/60 p-4"><h3 className="text-xs font-semibold text-red-900">Permanent deletion</h3><p className="mt-1 text-[11px] leading-5 text-red-800">Only use this for a legally approved data purge. This removes the business and its tenant data, while platform audit and status history are retained without the business row.</p><label className="field-label mt-3">Type <span className="font-mono">{businessName}</span> to confirm<input className="input-control" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label><button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50" disabled={busy || confirmation !== businessName}><Trash2 size={14} /> Permanently delete</button></form></div>}
    </div>
    {error && <p role="alert" className="alert-error mt-4">{error}</p>}
  </section>;
}
