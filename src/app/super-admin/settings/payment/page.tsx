import { connection } from "next/server";
import { redirect } from "next/navigation";
import { savePaymentSettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsPaymentPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Payment</h1>
        <p className="mt-2 text-sm text-slate-500">Default payment methods and collection preferences for the platform.</p>
      </div>
      <form action={savePaymentSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Default payment method<select className="input-control" defaultValue="cash" name="defaultPaymentMethod"><option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Mobile Money</option><option>Cheque</option></select><span className="field-hint">Pre-selected on new invoices and point-of-sale bills.</span></label>
        </div>
        <button className="button-primary">Save payment settings</button>
      </form>
    </main>
  );
}