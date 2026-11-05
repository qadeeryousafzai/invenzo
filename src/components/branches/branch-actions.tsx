"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Manager = { id: string; name: string | null; email: string };
type Branch = { id: string; name: string; code: string; phone: string | null; address: string | null; latitude: string | null; longitude: string | null; managerId: string | null; status: "ACTIVE" | "INACTIVE" };

export function BranchActions({ branch, managers, canManage }: { branch: Branch; managers: Manager[]; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  if (!canManage) return null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const lat = values.get("latitude")?.toString().trim();
    const lng = values.get("longitude")?.toString().trim();
    const response = await fetch(`/api/branches/${branch.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name"), code: values.get("code"), phone: values.get("phone") || null, address: values.get("address") || null, managerId: values.get("managerId") || null, latitude: lat ? Number(lat) : null, longitude: lng ? Number(lng) : null, status: values.get("status") }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(result.error ?? "Branch could not be updated."); return; }
    toast.success("Branch updated"); setEditing(false); router.refresh();
  }
  async function archive() {
    if (!window.confirm(`Archive “${branch.name}”? It will no longer appear in active branch lists.`)) return;
    setBusy(true);
    const response = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { toast.error(result.error ?? "Branch could not be archived."); return; }
    toast.success("Branch archived"); router.refresh();
  }

  return <div className="mt-4 border-t border-slate-100 pt-4">{!editing ? <div className="flex gap-2"><button className="button-secondary inline-flex items-center gap-1.5" disabled={busy} onClick={() => setEditing(true)}><Pencil size={13} /> Edit</button><button className="button-secondary inline-flex items-center gap-1.5 text-red-700" disabled={busy} onClick={() => void archive()}><Trash2 size={13} /> Archive</button></div> : <form onSubmit={save} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="field-label">Branch name<input className="input-control" name="name" defaultValue={branch.name} minLength={2} maxLength={191} required /></label><label className="field-label">Branch code<input className="input-control uppercase" name="code" defaultValue={branch.code} minLength={2} maxLength={32} required /></label><label className="field-label">Phone<input className="input-control" name="phone" defaultValue={branch.phone ?? ""} maxLength={40} /></label><label className="field-label">Manager<select className="input-control" name="managerId" defaultValue={branch.managerId ?? ""}><option value="">Unassigned</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name || manager.email}</option>)}</select></label><label className="field-label sm:col-span-2">Address<input className="input-control" name="address" defaultValue={branch.address ?? ""} maxLength={1000} /></label><label className="field-label">Latitude<input className="input-control" name="latitude" type="number" step="any" min="-90" max="90" defaultValue={branch.latitude ?? ""} /></label><label className="field-label">Longitude<input className="input-control" name="longitude" type="number" step="any" min="-180" max="180" defaultValue={branch.longitude ?? ""} /></label><label className="field-label sm:col-span-2">Status<select className="input-control" name="status" defaultValue={branch.status}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div>{error && <p role="alert" className="alert-error">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="button-secondary inline-flex items-center gap-1" onClick={() => setEditing(false)}><X size={14} /> Cancel</button><button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save</button></div></form>}</div>;
}
