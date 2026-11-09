import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveAppearanceSettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsAppearancePage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Appearance</h1>
        <p className="mt-2 text-sm text-slate-500">Branding and visual preferences for the admin panel.</p>
      </div>
      <form action={saveAppearanceSettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Brand color<input className="input-control" type="color" defaultValue="#175b45" name="brandColor" /><span className="field-hint">Primary accent used across the super-admin panel.</span></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="button-primary">Save appearance settings</button>
          <button type="button" className="inline-flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Reset to default</button>
        </div>
      </form>
    </main>
  );
}