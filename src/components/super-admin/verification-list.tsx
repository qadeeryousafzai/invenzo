"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Eye, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceAccessStatus } from "@/modules/businesses/subscription";

type Business = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
  accountStatus: WorkspaceAccessStatus;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  statusUntil: string | null;
  rejectionReason: string | null;
  statusReason: string | null;
  approvedByName: string | null;
  deletedAt: string | null;
  _count: { memberships: number; branches: number };
};

type Filters = { query: string; status: string };
type Pagination = { page: number; totalPages: number; total: number };

const statusClass: Record<WorkspaceAccessStatus, string> = {
  PENDING_APPROVAL: "bg-amber-50 text-amber-800",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-slate-100 text-slate-700",
  TEMPORARILY_BLOCKED: "bg-orange-50 text-orange-800",
  EXPIRED: "bg-orange-50 text-orange-800",
  DELETED: "bg-slate-200 text-slate-600",
};

const dateLabel = (value: string | null) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
  : "—";

export function VerificationList({ businesses, filters, pagination }: { businesses: Business[]; filters: Filters; pagination: Pagination }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const query = String(data.get("q") ?? "").trim();
    const status = String(data.get("status") ?? "");
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    router.push(`/super-admin${params.size ? `?${params.toString()}` : ""}`);
  }

  async function verificationAction(business: Business, action: "approve" | "reject" | "renew") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt(`Why is ${business.name} being rejected?`)?.trim();
      if (!reason) return;
    }
    if (action === "approve" && !window.confirm(`Approve ${business.name} and activate its workspace?`)) return;
    setBusy(business.id);
    try {
      const response = await fetch(`/api/super-admin/businesses/${business.id}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { toast.error(result.error ?? "Could not update the account."); return; }
      toast.success(action === "reject" ? "Application rejected." : action === "renew" ? "Access renewed." : "Business account approved.");
      router.refresh();
    } catch {
      toast.error("The account could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function manage(business: Business, action: "soft_delete" | "restore" | "delete") {
    let confirmation: string | undefined;
    if (action === "soft_delete" && !window.confirm(`Soft delete ${business.name}? Its data will be retained and can be restored.`)) return;
    if (action === "restore" && !window.confirm(`Restore ${business.name}? Its current account state and expiry will be reapplied.`)) return;
    if (action === "delete") {
      const entered = window.prompt(`Permanently delete ${business.name} and all workspace data? This cannot be undone. Type the exact business name to continue.`);
      if (entered !== business.name) return;
      confirmation = entered;
    }
    setBusy(business.id);
    try {
      const response = await fetch(`/api/super-admin/businesses/${business.id}/management`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(confirmation ? { confirmation } : {}) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { toast.error(result.error ?? "Could not update the account."); return; }
      toast.success(action === "delete" ? "Business and data permanently deleted." : action === "restore" ? "Business workspace restored." : "Business workspace soft deleted; data retained.");
      router.refresh();
    } catch {
      toast.error("The workspace could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.status) params.set("status", filters.status);
    if (page > 1) params.set("page", String(page));
    return `/super-admin?${params.toString()}`;
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="font-semibold text-slate-900">Business management</h2><p className="mt-1 text-xs text-slate-500">Review applications and manage business account access.</p></div>
        <form onSubmit={submitFilters} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="business-search">Search businesses</label>
          <input id="business-search" name="q" defaultValue={filters.query} placeholder="Business, owner, email, phone" className="input-control mt-0 min-w-56 py-2.5 text-xs" />
          <label className="sr-only" htmlFor="business-status">Filter by status</label>
          <select id="business-status" name="status" defaultValue={filters.status} className="input-control mt-0 py-2.5 text-xs sm:w-48">
            <option value="">All account statuses</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TEMPORARILY_BLOCKED">Temporarily blocked</option>
            <option value="EXPIRED">Expired</option>
            <option value="REJECTED">Rejected</option>
            <option value="DELETED">Deleted</option>
          </select>
          <button className="button-primary px-4 py-2.5 text-xs" type="submit">Search</button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-[#fafbfa] text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Business / owner</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Activated · expires</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {businesses.map((business) => {
              const isBusy = busy === business.id;
              return <tr key={business.id}>
                <td className="px-5 py-4"><p className="font-semibold text-slate-800">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.ownerName || "Owner unavailable"} · {business._count.branches} branch{business._count.branches === 1 ? "" : "es"}</p></td>
                <td className="px-5 py-4"><p className="text-xs text-slate-600">{business.ownerEmail || business.email || "No email"}</p></td>
                <td className="px-5 py-4 text-xs text-slate-600">{dateLabel(business.createdAt)}</td>
                <td className="px-5 py-4 text-xs text-slate-600">{dateLabel(business.subscriptionStartedAt)}<span className="mx-1 text-slate-300">·</span>{dateLabel(business.subscriptionExpiresAt)}</td>
                <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[business.accountStatus]}`}>{business.accountStatus.toLowerCase().replaceAll("_", " ")}</span></td>
                <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">
                  <Link href={`/super-admin/businesses/${business.id}`} className="button-secondary inline-flex items-center gap-1.5 py-2 text-[10px]"><Eye size={13} /> Details</Link>
                  {business.accountStatus === "PENDING_APPROVAL" && <>
                    <button className="button-secondary inline-flex items-center gap-1.5 py-2 text-[10px] text-emerald-800" disabled={Boolean(busy)} onClick={() => void verificationAction(business, "approve")}>{isBusy ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Approve</button>
                    <button className="button-secondary inline-flex items-center gap-1.5 py-2 text-[10px] text-red-700" disabled={Boolean(busy)} onClick={() => void verificationAction(business, "reject")}>{isBusy ? <LoaderCircle size={13} className="animate-spin" /> : <X size={13} />} Reject</button>
                    <button className="button-secondary py-2 text-[10px] text-slate-600" disabled={Boolean(busy)} onClick={() => void manage(business, "soft_delete")}>Delete request</button>
                  </>}
                  {business.accountStatus === "ACTIVE" && <button className="button-secondary py-2 text-[10px] text-emerald-800" disabled={Boolean(busy)} onClick={() => void verificationAction(business, "renew")}>Extend one month</button>}
                  {business.accountStatus === "DELETED" && <>
                    <button className="button-secondary py-2 text-[10px]" disabled={Boolean(busy)} onClick={() => void manage(business, "restore")}>Restore</button>
                    <button className="button-secondary py-2 text-[10px] text-red-800" disabled={Boolean(busy)} onClick={() => void manage(business, "delete")}>Delete permanently</button>
                  </>}
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!businesses.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No businesses match these filters.</div>}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{pagination.total ? `Showing ${(pagination.page - 1) * 20 + 1}–${Math.min(pagination.page * 20, pagination.total)} of ${pagination.total} businesses` : "No businesses found"}</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={pagination.page <= 1} href={pageHref(Math.max(1, pagination.page - 1))} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${pagination.page <= 1 ? "pointer-events-none opacity-45" : ""}`}><ChevronLeft size={14} /> Previous</Link>
          <span className="px-2 text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
          <Link aria-disabled={pagination.page >= pagination.totalPages} href={pageHref(Math.min(pagination.totalPages, pagination.page + 1))} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${pagination.page >= pagination.totalPages ? "pointer-events-none opacity-45" : ""}`}>Next <ChevronRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}
