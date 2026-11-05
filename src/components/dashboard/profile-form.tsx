"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LoaderCircle, Save, ShieldCheck } from "lucide-react";

export function ProfileForm({ name, email, verified }: { name: string; email: string; verified: boolean }) {
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setProfileError("");
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name") }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setProfileError(result.error ?? "Profile could not be updated."); return; }
    toast.success("Profile updated");
  }
  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (values.get("newPassword") !== values.get("confirmPassword")) { setPasswordError("New passwords do not match."); return; }
    setBusy(true); setPasswordError("");
    const response = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: values.get("currentPassword"), newPassword: values.get("newPassword") }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setPasswordError(result.error ?? "Password could not be changed."); return; }
    toast.success(result.message);
    await signOut({ callbackUrl: "/login" });
  }
  return <div className="grid gap-5 xl:grid-cols-2"><section className="surface-card p-5 sm:p-6"><div className="mb-6"><h2 className="font-semibold text-slate-900">Personal details</h2><p className="mt-1 text-xs text-slate-500">Account email is read-only to protect workspace access.</p></div><form onSubmit={updateProfile} className="space-y-5"><label className="field-label">Full name<input className="input-control" name="name" defaultValue={name} minLength={2} maxLength={100} required /></label><label className="field-label">Account email<input className="input-control cursor-not-allowed bg-slate-50 text-slate-500" value={email} readOnly /><span className={`field-hint ${verified ? "text-emerald-700" : "text-amber-700"}`}>{verified ? "Verified email" : "Email verification required"}</span></label>{profileError && <p role="alert" className="alert-error">{profileError}</p>}<button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Save profile</button></form></section>
    <section className="surface-card p-5 sm:p-6"><div className="mb-6"><h2 className="font-semibold text-slate-900">Change password</h2><p className="mt-1 text-xs text-slate-500">Other active sessions are invalidated after a successful change.</p></div><form onSubmit={updatePassword} className="space-y-4"><label className="field-label">Current password<input className="input-control" name="currentPassword" type="password" autoComplete="current-password" required /></label><label className="field-label">New password<input className="input-control" name="newPassword" type="password" autoComplete="new-password" minLength={12} required /><span className="field-hint">12+ characters, including uppercase, lowercase, and a number.</span></label><label className="field-label">Confirm new password<input className="input-control" name="confirmPassword" type="password" autoComplete="new-password" required /></label>{passwordError && <p role="alert" className="alert-error">{passwordError}</p>}<button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Update password</button></form></section>
  </div>;
}
