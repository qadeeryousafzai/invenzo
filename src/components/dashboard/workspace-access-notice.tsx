import Link from "next/link";
import { Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import type { WorkspaceAccessStatus } from "@/modules/businesses/subscription";

const dateLabel = (value: string | null) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value))
  : null;

export function WorkspaceAccessNotice({ businessName, status, expiresAt, reason }: {
  businessName: string;
  status: Exclude<WorkspaceAccessStatus, "ACTIVE">;
  expiresAt: string | null;
  reason?: string | null;
}) {
  const expired = status === "EXPIRED";
  const rejected = status === "REJECTED";
  const deleted = status === "DELETED";
  const temporary = status === "TEMPORARILY_BLOCKED";
  const Icon = expired || status === "SUSPENDED" || temporary || deleted ? LockKeyhole : rejected ? ShieldCheck : Clock3;

  const title = expired ? "Your account access has expired"
    : status === "SUSPENDED" ? "Workspace access is suspended"
      : temporary ? "Workspace access is temporarily restricted"
        : deleted ? "This workspace is deleted"
          : rejected ? "Workspace request not approved"
            : "Workspace request under review";
  const description = expired
    ? `Access ended${expiresAt ? ` on ${dateLabel(expiresAt)}` : ""}. Your account and business data remain saved. Contact the platform administrator to reactivate access.`
    : status === "SUSPENDED" || temporary
      ? `${reason || "A platform administrator restricted this workspace."} Your account and business data remain saved. Contact the platform administrator if you need access restored.`
      : deleted
        ? "This workspace was soft deleted by the platform administrator. Its account and business data are retained; contact the administrator if you need access restored."
        : rejected
          ? `This workspace is not available. ${reason || "Contact the platform administrator if you believe this was a mistake."}`
          : "Your business details have been submitted for review. Workspace access begins after the platform administrator approves the request.";

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f6] px-5 py-12">
      <section className="surface-card w-full max-w-xl p-7 sm:p-10">
        <span className={`grid size-12 place-items-center rounded-2xl ${expired || status === "SUSPENDED" || temporary || deleted ? "bg-orange-50 text-orange-800" : rejected ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}><Icon size={22} /></span>
        <p className="mt-6 text-xs font-bold tracking-[.14em] text-slate-500">WORKSPACE ACCESS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{businessName}</p>
        <p className="mt-6 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/" className="button-secondary">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
