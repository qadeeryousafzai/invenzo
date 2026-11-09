import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveGeneralSettings } from "@/app/super-admin/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsGeneralPage() {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">General</h1>
        <p className="mt-2 text-sm text-slate-500">Default access and expiry behavior for new business approvals.</p>
      </div>
      <form action={saveGeneralSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <input type="hidden" name="id" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Default access duration in months<input className="input-control" type="number" min={1} max={120} required defaultValue={String(settings.defaultAccessMonths)} name="defaultAccessMonths" /><span className="field-hint">1 to 120 months. The access period starts on the activation date.</span></label>
          </div>
          <div>
            <label className="field-label">Expiry warning lead time in days<input className="input-control" type="number" min={0} max={90} required defaultValue={String(settings.expiryWarningDays)} name="expiryWarningDays" /><span className="field-hint">Owners and admins are notified this many days before expiry. Set 0 to disable warnings.</span></label>
          </div>
        </div>
        <button className="button-primary">Save general settings</button>
      </form>
    </main>
  );
}