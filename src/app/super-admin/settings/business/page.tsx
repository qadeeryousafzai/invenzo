import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveBusinessSettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsBusinessPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Business</h1>
        <p className="mt-2 text-sm text-slate-500">Default currency and timezone applied across platform documents.</p>
      </div>
      <form action={saveBusinessSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Default currency
              <select className="input-control" defaultValue="USD" name="currency"><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AED</option><option>SAR</option></select><span className="field-hint">Used on invoices, receipts, and reports.</span></label>
          </div>
          <div>
            <label className="field-label">Default timezone
              <select className="input-control" defaultValue="UTC" name="timezone"><option>UTC</option><option>Asia/Karachi</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option></select><span className="field-hint">Used for schedules, expiry, and report dates.</span></label>
          </div>
        </div>
        <button className="button-primary">Save business settings</button>
      </form>
    </main>
  );
}