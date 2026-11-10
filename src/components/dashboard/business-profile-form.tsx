"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";

type BusinessProfile = { name: string; description: string | null; email: string | null; phone: string | null; address: string | null; taxId: string | null; website: string | null; currency: string; timezone: string; accountStatus: string; type: string };
const currencies = ["USD", "EUR", "GBP", "PKR", "INR", "CAD", "AUD", "AED", "JPY", "CHF"];
const timezones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Karachi", "Asia/Kolkata", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];

export function BusinessProfileForm({ business, canManage }: { business: BusinessProfile; canManage: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const response = await fetch("/api/businesses/current", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name"), description: values.get("description") || null, email: values.get("email") || null, phone: values.get("phone") || null, address: values.get("address") || null, taxId: values.get("taxId") || null, website: values.get("website") || null, currency: values.get("currency"), timezone: values.get("timezone") }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(result.error ?? "Business profile could not be updated."); return; }
    toast.success("Business profile updated"); router.refresh();
  }
  return <section className="surface-card p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-black">Business details</h2><p className="mt-1 text-xs text-gray-600">Profile information belongs only to your active workspace.</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${business.accountStatus === "ACTIVE" ? "bg-gray-100 text-black" : "bg-gray-100 text-black"}`}>{business.accountStatus.toLowerCase().replaceAll("_", " ")}</span></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label className="field-label">Business name<input className="input-control" name="name" defaultValue={business.name} minLength={2} maxLength={191} required disabled={!canManage} /></label><label className="field-label">Business type<input className="input-control cursor-not-allowed bg-gray-50" value={business.type.replaceAll("_", " ").toLowerCase()} readOnly /></label><label className="field-label">Business email<input className="input-control" name="email" type="email" defaultValue={business.email ?? ""} maxLength={191} disabled={!canManage} /></label><label className="field-label">Phone<input className="input-control" name="phone" type="tel" defaultValue={business.phone ?? ""} maxLength={40} disabled={!canManage} /></label><label className="field-label sm:col-span-2">Address<input className="input-control" name="address" defaultValue={business.address ?? ""} maxLength={1000} disabled={!canManage} /></label><label className="field-label sm:col-span-2">Description<textarea className="input-control min-h-24 resize-y" name="description" defaultValue={business.description ?? ""} maxLength={2000} disabled={!canManage} /></label><label className="field-label">Tax ID<input className="input-control" name="taxId" defaultValue={business.taxId ?? ""} maxLength={100} disabled={!canManage} /></label><label className="field-label">Website<input className="input-control" name="website" type="url" defaultValue={business.website ?? ""} maxLength={255} placeholder="https://example.com" disabled={!canManage} /></label><label className="field-label">Currency<select className="input-control" name="currency" defaultValue={business.currency} disabled={!canManage}>{[...new Set([...currencies, business.currency])].map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label><label className="field-label">Timezone<select className="input-control" name="timezone" defaultValue={business.timezone} disabled={!canManage}>{[...new Set([...timezones, business.timezone])].map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}</select></label>{error && <p role="alert" className="alert-error sm:col-span-2">{error}</p>}{canManage && <div className="flex justify-end sm:col-span-2"><button className="button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Save business profile</button></div>}</form><p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-500">Business logo upload will be available when storage configuration is added in a later phase.</p></section>;
}
