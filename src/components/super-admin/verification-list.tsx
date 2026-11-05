"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

type Business = { id: string; name: string; type: string; email: string | null; createdAt: string; verificationStatus: string; _count: { memberships: number; branches: number } };

export function VerificationList({ businesses }: { businesses: Business[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  async function setStatus(id: string, status: "VERIFIED" | "REJECTED") {
    setBusy(id);
    const response = await fetch(`/api/super-admin/businesses/${id}/verification`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { toast.error(result.error ?? "Could not update verification"); return; }
    toast.success(status === "VERIFIED" ? "Business verified" : "Business verification rejected");
    router.refresh();
  }
  return <div className="surface-card overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Business verification</h2><p className="mt-1 text-xs text-slate-500">Review workspace profiles without accessing private operational data.</p></div><div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-[#fafbfa] text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Business</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Members</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{businesses.map((business) => <tr key={business.id}><td className="px-5 py-4"><p className="font-semibold text-slate-800">{business.name}</p><p className="mt-1 text-xs text-slate-500">{business.email || "No business email"}</p></td><td className="px-5 py-4 text-xs capitalize text-slate-600">{business.type.replaceAll("_", " ").toLowerCase()}</td><td className="px-5 py-4 text-xs text-slate-600">{business._count.memberships} members · {business._count.branches} branches</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${business.verificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800" : business.verificationStatus === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{business.verificationStatus.toLowerCase()}</span></td><td className="px-5 py-4"><div className="flex gap-2">{business.verificationStatus !== "VERIFIED" && <button className="button-secondary inline-flex items-center gap-1.5 text-emerald-800" disabled={Boolean(busy)} onClick={() => void setStatus(business.id, "VERIFIED")}>{busy === business.id ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Verify</button>}{business.verificationStatus !== "REJECTED" && <button className="button-secondary inline-flex items-center gap-1.5 text-red-700" disabled={Boolean(busy)} onClick={() => void setStatus(business.id, "REJECTED")}>{busy === business.id ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />} Reject</button>}</div></td></tr>)}</tbody></table>{!businesses.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No business workspaces have been registered.</div>}</div></div>;
}
