import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SuperAdminHelpPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM SUPPORT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Help & Support</h1>
        <p className="mt-2 text-sm text-slate-500">Help and support documentation for platform administrators.</p>
      </div>
      <div className="surface-card p-6 space-y-4">
        <div className="border-l-4 border-emerald-500 pl-4">
          <h3 className="font-semibold text-slate-900">Getting Started</h3>
          <p className="mt-1 text-sm text-slate-600">Learn how to use the super admin panel to manage businesses, users, and platform settings.</p>
        </div>
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold text-slate-900">Business Management</h3>
          <p className="mt-1 text-sm text-slate-600">Approve, suspend, or manage business accounts and their access periods.</p>
        </div>
        <div className="border-l-4 border-amber-500 pl-4">
          <h3 className="font-semibold text-slate-900">User Management</h3>
          <p className="mt-1 text-sm text-slate-600">Create, suspend, or manage platform user accounts and super admin privileges.</p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="font-semibold text-slate-900">Reports & Analytics</h3>
          <p className="mt-1 text-sm text-slate-600">Generate comprehensive reports on sales, purchases, inventory, and financial performance.</p>
        </div>
        <div className="border-l-4 border-red-500 pl-4">
          <h3 className="font-semibold text-slate-900">Need Help?</h3>
          <p className="mt-1 text-sm text-slate-600">Contact support at support@invenzo.com for assistance with platform administration.</p>
        </div>
      </div>
    </main>
  );
}