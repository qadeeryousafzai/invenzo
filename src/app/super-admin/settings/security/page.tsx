import { connection } from "next/server";
import { redirect } from "next/navigation";
import { saveSecuritySettings } from "@/app/super-admin/actions";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SettingsSecurityPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Security</h1>
        <p className="mt-2 text-sm text-slate-500">Session and access controls for the platform.</p>
      </div>
      <form action={saveSecuritySettings} className="surface-card p-5 space-y-4 sm:p-7">
        <div>
          <label className="field-label">Admin session lifetime in minutes<input className="input-control" type="number" min={15} max={43200} required defaultValue="480" name="sessionMinutes" /><span className="field-hint">How long a super admin session stays valid before re-authentication.</span></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="button-primary">Save security settings</button>
          <button type="button" className="inline-flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Force sign-out all sessions</button>
        </div>
      </form>
    </main>
  );
}