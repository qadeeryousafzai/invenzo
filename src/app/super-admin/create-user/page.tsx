import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SuperAdminCreateUserPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">USER MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Create User</h1>
        <p className="mt-2 text-sm text-slate-500">Create a new user account for the platform.</p>
      </div>
      <div className="surface-card p-6">
        <form className="space-y-4">
          <div>
            <label className="field-label">Full name<input className="input-control" type="text" required placeholder="John Doe" /></label>
          </div>
          <div>
            <label className="field-label">Email address<input className="input-control" type="email" required placeholder="john@example.com" /></label>
          </div>
          <div>
            <label className="field-label">Password<input className="input-control" type="password" required placeholder="••••••••" minLength={8} /></label>
          </div>
          <div>
            <label className="field-label">Role
              <select className="input-control mt-1">
                <option value="USER">Client User</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>
          </div>
          <button type="submit" className="button-primary">Create User</button>
        </form>
      </div>
    </main>
  );
}