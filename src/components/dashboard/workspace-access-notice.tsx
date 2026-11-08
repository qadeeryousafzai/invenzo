import Link from "next/link";
import { Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import type { WorkspaceAccessStatus } from "@/modules/businesses/subscription";

const dateLabel = (value: string | null) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value))
  : null;

export function WorkspaceAccessNotice({ businessName, status, expiresAt }: { businessName: string; status: Exclude<WorkspaceAccessStatus, "ACTIVE">; expiresAt: string | null }) {
  const expired = status === "EXPIRED";
  const rejected = status === "REJECTED";
  const paused = status === "PAUSED";
  const archived = status === "ARCHIVED";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f6] px-5 py-12">
      <section className="surface-card w-full max-w-xl p-7 sm:p-10">
        <span className={`grid size-12 place-items-center rounded-2xl ${expired ? "bg-orange-50 text-orange-800" : rejected ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
          {expired || paused || archived ? <LockKeyhole size={22} /> : rejected ? <ShieldCheck size={22} /> : <Clock3 size={22} />}
        </span>
        <p className="mt-6 text-xs font-bold tracking-[.14em] text-slate-500">WORKSPACE ACCESS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {expired ? "Your monthly access has ended" : paused ? "Workspace access is temporarily paused" : archived ? "This workspace is archived" : rejected ? "Workspace request not approved" : "Workspace request under review"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{businessName}</p>

        {expired ? (
          <div className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
            <p>{expiresAt ? `Access ended on ${dateLabel(expiresAt)}.` : "The paid access period has ended."} Your workspace is paused, but your sign-in account and business data have not been deleted.</p>
            <p>After the offline payment is received, the platform administrator can renew access for another month. Your team can then continue using the existing workspace and data.</p>
          </div>
        ) : paused ? (
          <p className="mt-6 text-sm leading-6 text-slate-600">A platform administrator temporarily paused this workspace. Your sign-in account and business data remain saved. Contact the administrator to restore access.</p>
        ) : archived ? (
          <p className="mt-6 text-sm leading-6 text-slate-600">This workspace has been archived by the platform administrator. Your sign-in account and business data are retained; contact the administrator if you need access restored.</p>
        ) : rejected ? (
          <p className="mt-6 text-sm leading-6 text-slate-600">This workspace is not available. Your account and submitted business information remain saved. Contact the platform administrator if you believe this was a mistake.</p>
        ) : (
          <p className="mt-6 text-sm leading-6 text-slate-600">Your business details have been submitted for review. Once approved after offline payment is confirmed, the workspace will be available for one calendar month.</p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/" className="button-secondary">Back to home</Link>
          <span className="text-xs text-slate-400">No accounts or workspace data are removed when access pauses.</span>
        </div>
      </section>
    </main>
  );
}