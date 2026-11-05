"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

type Manager = { id: string; name: string | null; email: string };

export function CreateBranchForm({ managers, canManage }: { managers: Manager[]; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  if (!canManage) return <p className="text-sm text-slate-500">You can view locations, but branch management permission is required to add one.</p>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const response = await fetch("/api/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: values.get("name"), code: values.get("code"), phone: values.get("phone") || undefined, address: values.get("address") || undefined, managerId: values.get("managerId") || undefined,
        latitude: values.get("latitude") ? Number(values.get("latitude")) : undefined,
        longitude: values.get("longitude") ? Number(values.get("longitude")) : undefined,
    }) });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(result.error ?? "Branch could not be created."); return; }
    toast.success("Branch created with a main warehouse");
    setOpen(false);
    router.refresh();
  }

  return <>
    {!open ? <button className="button-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add branch</button> : <section className="surface-card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Create branch</h2><p className="mt-1 text-xs text-slate-500">A main warehouse will be created automatically.</p></div><button onClick={() => setOpen(false)} aria-label="Close form" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label className="field-label">Branch name<input className="input-control" name="name" minLength={2} maxLength={191} required placeholder="Northside store" /></label><label className="field-label">Branch code<input className="input-control uppercase" name="code" minLength={2} maxLength={32} required placeholder="NORTH-01" /></label><label className="field-label">Phone<input className="input-control" name="phone" type="tel" maxLength={40} /></label><label className="field-label">Manager <span className="font-normal text-slate-400">(optional)</span><select className="input-control" name="managerId" defaultValue=""><option value="">Unassigned</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name || manager.email}</option>)}</select></label><label className="field-label sm:col-span-2">Address<input className="input-control" name="address" maxLength={1000} placeholder="Street, city, region" /></label><label className="field-label">Latitude <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="latitude" type="number" step="any" min="-90" max="90" /></label><label className="field-label">Longitude <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="longitude" type="number" step="any" min="-180" max="180" /></label>{error && <p role="alert" className="alert-error sm:col-span-2">{error}</p>}<div className="flex justify-end gap-3 sm:col-span-2"><button className="button-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />} Create branch</button></div></form></section>}
  </>;
}
