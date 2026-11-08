"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { getWorkspaceAccessStatus, type WorkspaceAccessStatus } from "@/modules/businesses/subscription";

type Business = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  createdAt: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  accessPausedAt: string | null;
  accessPausedReason: string | null;
  deletedAt: string | null;
  _count: { memberships: number; branches: number };
};

const statusClass: Record<WorkspaceAccessStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  EXPIRED: "bg-orange-50 text-orange-800",
  REJECTED: "bg-red-50 text-red-700",
  PAUSED: "bg-slate-100 text-slate-700",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const dateLabel = (value: string | null) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
  : "Not activated";

export function VerificationList({ businesses }: { businesses: Business[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function performAction(id: string, action: "approve" | "reject" | "renew") {
    setBusy(id);
    try {
      const response = await fetch(`/api/super-admin/businesses/${id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error ?? "Could not update workspace access.");
        return;
      }
      toast.success(action === "reject"
        ? "Workspace request rejected."
        : action === "renew"
          ? "One month of workspace access added."
          : "Workspace approved for one month.");
      router.refresh();
    } catch {
      toast.error("Workspace access could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function manageWorkspace(business: Business, action: "pause" | "resume" | "archive" | "restore" | "delete") {
    if (action === "archive" && !window.confirm("Archive this workspace? Its accounts and business data will be retained and can be restored by a superadmin.")) return;
    let confirmation: string | undefined;
    if (action === "delete") {
      const entered = window.prompt(`Permanently delete ${business.name} and all workspace data? This cannot be undone. Type the exact workspace name to continue.`);
      if (entered !== business.name) return;
      confirmation = entered;
    }
    setBusy(business.id);
    try {
      const response = await fetch(`/api/super-admin/businesses/${business.id}/management`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirmation }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error ?? "Could not update workspace.");
        return;
      }
      toast.success(action === "delete" ? "Workspace permanently deleted." : action === "archive" ? "Workspace archived; its data is retained." : action === "restore" ? "Workspace restored." : action === "pause" ? "Workspace access paused." : "Workspace access resumed.");
      router.refresh();
    } catch {
      toast.error("Workspace could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Workspace approval and access</h2>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
          Approving grants one calendar month after offline payment is received. Renewals add another month. Expired workspaces are paused without deleting accounts or business data.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="bg-[#fafbfa] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Business</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Members</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Paid through</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {businesses.map((business) => {
              const status = getWorkspaceAccessStatus({
                verificationStatus: business.verificationStatus,
                subscriptionExpiresAt: business.subscriptionExpiresAt ? new Date(business.subscriptionExpiresAt) : null,
                accessPausedAt: business.accessPausedAt ? new Date(business.accessPausedAt) : null,
                deletedAt: business.deletedAt ? new Date(business.deletedAt) : null,
              });
              const isBusy = busy === business.id;
              return (
                <tr key={business.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{business.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{business.email || "No business email"}</p>
                  </td>
                  <td className="px-5 py-4 text-xs capitalize text-slate-600">{business.type.replaceAll("_", " ").toLowerCase()}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{business._count.memberships} members · {business._count.branches} branches</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[status]}`}>
                      {status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">{dateLabel(business.subscriptionExpiresAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(status === "PENDING" || status === "REJECTED") && (
                        <button className="button-secondary inline-flex items-center gap-1.5 text-emerald-800" disabled={Boolean(busy)} onClick={() => void performAction(business.id, "approve")}>
                          {isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Approve · 1 month
                        </button>
                      )}
                      {(status === "ACTIVE" || status === "EXPIRED" || (status === "PAUSED" && business.verificationStatus === "VERIFIED")) && (
                        <button className="button-secondary inline-flex items-center gap-1.5 text-emerald-800" disabled={Boolean(busy)} onClick={() => void performAction(business.id, "renew")}>
                          {isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />} Renew · 1 month
                        </button>
                      )}
                      {status === "PENDING" && (
                        <button className="button-secondary inline-flex items-center gap-1.5 text-red-700" disabled={Boolean(busy)} onClick={() => void performAction(business.id, "reject")}>
                          {isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />} Reject
                        </button>
                      )}
                      {status === "ARCHIVED" ? (
                        <button className="button-secondary" disabled={Boolean(busy)} onClick={() => void manageWorkspace(business, "restore")}>Restore workspace</button>
                      ) : (
                        <>
                          {status !== "PAUSED" && <button className="button-secondary" disabled={Boolean(busy)} onClick={() => void manageWorkspace(business, "pause")}>Pause access</button>}
                          {status === "PAUSED" && <button className="button-secondary" disabled={Boolean(busy)} onClick={() => void manageWorkspace(business, "resume")}>Resume access</button>}
                          <button className="button-secondary text-red-700" disabled={Boolean(busy)} onClick={() => void manageWorkspace(business, "archive")}>Archive</button>
                        </>
                      )}
                      <button className="button-secondary text-red-800" disabled={Boolean(busy)} onClick={() => void manageWorkspace(business, "delete")}>Delete permanently</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!businesses.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No business workspaces have been registered.</div>}
      </div>
    </div>
  );
}