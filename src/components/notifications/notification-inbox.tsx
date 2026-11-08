"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CircleDot, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Notice = { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string; business: { id: string; name: string } | null };

export function NotificationInbox({ notifications, unreadCount, audience }: { notifications: Notice[]; unreadCount: number; audience: "platform" | "business" }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function markRead(id?: string) {
    setBusy(id ?? "all");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { markAll: true }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { toast.error(payload.error ?? "Notifications could not be updated."); return; }
      router.refresh();
    } catch {
      toast.error("Notifications could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  return <section className="surface-card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Bell size={17} /></span><div><h2 className="font-semibold text-slate-900">Notification history</h2><p className="mt-1 text-[11px] text-slate-500">{unreadCount} unread · newest first</p></div></div>{unreadCount > 0 && <button className="button-secondary inline-flex items-center gap-1.5 text-xs" disabled={Boolean(busy)} onClick={() => void markRead()}>{busy === "all" ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Mark all read</button>}</div>
    {notifications.length ? <ol className="divide-y divide-slate-100">{notifications.map((notice) => <li key={notice.id} className={`flex gap-3 px-5 py-4 ${notice.readAt ? "bg-white" : "bg-emerald-50/30"}`}><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${notice.readAt ? "bg-slate-50 text-slate-400" : "bg-emerald-50 text-emerald-800"}`}>{notice.readAt ? <Bell size={14} /> : <CircleDot size={14} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-semibold text-slate-800">{notice.title}</h3>{!notice.readAt && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">New</span>}</div><p className="mt-1 text-xs leading-5 text-slate-600">{notice.body}</p><p className="mt-2 text-[10px] text-slate-400">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notice.createdAt))}{notice.business ? ` · ${notice.business.name}` : ""}</p>{audience === "platform" && notice.business && <Link href={`/super-admin/businesses/${notice.business.id}`} className="mt-2 inline-flex text-[10px] font-semibold text-emerald-800 hover:text-emerald-950">Open business account</Link>}</div>{!notice.readAt && <button aria-label={`Mark ${notice.title} as read`} className="button-secondary h-8 shrink-0 px-2" disabled={Boolean(busy)} onClick={() => void markRead(notice.id)}>{busy === notice.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}</button>}</li>)}</ol> : <div className="px-5 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Bell size={20} /></span><p className="mt-3 text-sm font-semibold text-slate-700">No notifications yet</p><p className="mt-1 text-xs text-slate-500">Account activity and important updates will appear here.</p></div>}
  </section>;
}
