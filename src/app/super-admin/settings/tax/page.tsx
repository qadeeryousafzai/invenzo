import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveTaxSettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsTaxPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Tax</h1>
        <p className="mt-2 text-sm text-slate-500">Default tax configuration used across invoices and reports.</p>
      </div>
      <form action={saveTaxSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Tax ID / registration number<input className="input-control" defaultValue="" name="taxId" /><span className="field-hint">Printed on invoices where required.</span></label>
        </div>
        <div>
          <label className="field-label">Default tax rate (%)<input className="input-control" type="number" min={0} max={100} step={0.01} defaultValue="0" name="defaultTaxRate" /><span className="field-hint">Applied as the default on new documents unless overridden.</span></label>
        </div>
        <button className="button-primary">Save tax settings</button>
      </form>
    </main>
  );
}