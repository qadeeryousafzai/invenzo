"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";

export function PlatformSettingsForm({ defaultAccessMonths, expiryWarningDays }: { defaultAccessMonths: number; expiryWarningDays: number }) {
  const router = useRouter();
  const [months, setMonths] = useState(String(defaultAccessMonths));
  const [warning, setWarning] = useState(String(expiryWarningDays));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultAccessMonths: Number(months), expiryWarningDays: Number(warning) }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.error ?? "Settings could not be saved."); return; }
      toast.success("Platform access settings saved.");
      router.refresh();
    } catch {
      setError("Platform settings could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="surface-card space-y-5 p-5 sm:p-7">
    <div><h2 className="font-semibold text-slate-900">Business account validity</h2><p className="mt-1 text-xs leading-5 text-slate-500">New approvals and default reactivations use this duration. Existing expiry dates are not changed.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="field-label">Default access duration in months<input className="input-control" type="number" min={1} max={120} required value={months} onChange={(event) => setMonths(event.target.value)} /><span className="field-hint">1 to 120 months. Approval starts the period on the activation date.</span></label>
      <label className="field-label">Expiry warning lead time in days<input className="input-control" type="number" min={0} max={90} required value={warning} onChange={(event) => setWarning(event.target.value)} /><span className="field-hint">The scheduled account job notifies owners and admins this many days before expiry. Set 0 to disable advance warnings.</span></label>
    </div>
    {error && <p role="alert" className="alert-error">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="inline-flex items-center gap-2 text-xs text-slate-500"><CalendarClock size={15} />Expiry is based on activation, not login activity.</p><button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Save settings</button></div>
  </form>;
}
