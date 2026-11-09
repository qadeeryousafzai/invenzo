import { connection } from "next/server";
import { redirect } from "next/navigation";
import { savePharmacyProfile } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsPharmacyProfilePage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Pharmacy Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Public identity shown on invoices, receipts, and the storefront.</p>
      </div>
      <form action={savePharmacyProfile} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Pharmacy name<input className="input-control" required defaultValue="" name="pharmacyName" /><span className="field-hint">Appears on printed receipts and invoices.</span></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Email<input className="input-control" type="email" defaultValue="" name="pharmacyEmail" /><span className="field-hint">Contact email printed on documents.</span></label>
          </div>
          <div>
            <label className="field-label">Phone<input className="input-control" type="tel" defaultValue="" name="pharmacyPhone" /><span className="field-hint">Contact phone printed on documents.</span></label>
          </div>
        </div>
        <button className="button-primary">Save pharmacy profile</button>
      </form>
    </main>
  );
}