import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveNotificationSettings } from "@/app/super-admin/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsNotificationPage() {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notification</h1>
        <p className="mt-2 text-sm text-slate-500">Platform-wide alert preferences for administrators.</p>
      </div>
      <form action={saveNotificationSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Expiry warning lead time in days<input className="input-control" type="number" min={0} max={90} required defaultValue={String(settings.expiryWarningDays)} name="expiryWarningDays" /><span className="field-hint">Notify business owners and admins this many days before a subscription expires.</span></label>
        </div>
        <button className="button-primary">Save notification settings</button>
      </form>
    </main>
  );
}