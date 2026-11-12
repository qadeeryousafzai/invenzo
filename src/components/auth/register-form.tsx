"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (values.get("password") !== values.get("confirmPassword")) { setError("Passwords do not match."); toast.error("Passwords do not match"); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        ownerName: values.get("ownerName"), email: values.get("email"), password: values.get("password"), businessName: values.get("businessName"), businessType: values.get("businessType"), phone: values.get("phone") || undefined, address: values.get("address") || undefined, description: values.get("description") || undefined, taxId: values.get("taxId") || undefined, website: values.get("website") || undefined, currency: values.get("currency"), timezone: values.get("timezone"), branchName: values.get("branchName"), branchCode: values.get("branchCode"), branchPhone: values.get("branchPhone") || undefined, branchAddress: values.get("branchAddress") || undefined,
      }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { const message = payload.error ?? "Workspace could not be created."; setError(message); toast.error(message); return; }
      toast.success("Request submitted. Verify your email; workspace access starts after admin approval.");
      router.push("/verify-email?sent=1");
    } catch {
      const message = "Registration service is unavailable. Check your connection and try again.";
      setError(message); toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">Your name<input className="input-control" name="ownerName" autoComplete="name" required minLength={2} maxLength={100} /></label>
        <label className="field-label">Work email<input className="input-control" name="email" type="email" autoComplete="email" required /></label>
        <label className="field-label">Business name<input className="input-control" name="businessName" required minLength={2} maxLength={191} /></label>
        <label className="field-label">Business type<select className="input-control" name="businessType" defaultValue="GENERAL_RETAIL"><option value="GENERAL_RETAIL">General retail</option><option value="PHARMACY">Pharmacy / medical</option><option value="GROCERY">Grocery / supermarket</option><option value="ELECTRONICS">Electronics</option><option value="CLOTHING">Clothing</option><option value="WHOLESALE">Wholesale / distribution</option><option value="OTHER">Other</option></select></label>
        <label className="field-label">First branch<input className="input-control" name="branchName" required minLength={2} maxLength={191} defaultValue="Main branch" /></label>
        <label className="field-label">Branch code<input className="input-control uppercase" name="branchCode" required minLength={2} maxLength={32} defaultValue="MAIN" /></label>
        <label className="field-label">Business phone <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="phone" type="tel" maxLength={40} /></label>
        <label className="field-label sm:col-span-2">Business address <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="address" maxLength={1000} /></label>
        <label className="field-label">Branch phone <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="branchPhone" type="tel" maxLength={40} /></label>
        <label className="field-label">Branch address <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="branchAddress" maxLength={1000} /></label>
        <label className="field-label sm:col-span-2">Business description <span className="font-normal text-slate-400">(optional)</span><textarea className="input-control min-h-20 resize-y" name="description" maxLength={2000} /></label>
        <label className="field-label">Tax ID <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="taxId" maxLength={100} /></label>
        <label className="field-label">Website <span className="font-normal text-slate-400">(optional)</span><input className="input-control" name="website" type="url" maxLength={255} placeholder="https://example.com" /></label>
        <label className="field-label">Currency<select className="input-control" name="currency" defaultValue="PKR"><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="INR">INR — Indian Rupee</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option></select></label>
        <label className="field-label">Timezone<select className="input-control" name="timezone" defaultValue="UTC"><option value="UTC">UTC</option><option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option><option value="Europe/London">London</option><option value="Europe/Paris">Central Europe</option><option value="Asia/Karachi">Pakistan</option><option value="Asia/Kolkata">India</option><option value="Asia/Dubai">Gulf Standard Time</option><option value="Australia/Sydney">Sydney</option></select></label>
        <label className="field-label">Password<input className="input-control" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /><span className="field-hint">12+ characters, including uppercase, lowercase, and a number.</span></label>
        <label className="field-label">Confirm password<input className="input-control" name="confirmPassword" type="password" autoComplete="new-password" required /></label>
      </div>
      {error && <p role="alert" className="alert-error">{error}</p>}
      <p className="text-center text-xs leading-5 text-slate-500">Your request will be reviewed by the platform admin. One month of access starts after approval and offline payment confirmation.</p>
      <button className="button-primary w-full" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : <>Submit workspace for approval <ArrowRight size={17} /></>}</button>
      <p className="text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-semibold text-emerald-800">Sign in</Link></p>
    </form>
  );
}
