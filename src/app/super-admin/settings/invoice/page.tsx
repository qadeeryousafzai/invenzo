import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveInvoiceSettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsInvoicePage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Invoice</h1>
        <p className="mt-2 text-sm text-slate-500">Invoice numbering and document defaults.</p>
      </div>
      <form action={saveInvoiceSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Invoice number prefix<input className="input-control" defaultValue="INV" name="invoicePrefix" /><span className="field-hint">Prepended to generated invoice numbers, e.g. INV-1001.</span></label>
        </div>
        <button className="button-primary">Save invoice settings</button>
      </form>
    </main>
  );
}