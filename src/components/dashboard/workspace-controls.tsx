"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Workspace = { id: string; name: string; role: string };

export function WorkspaceControls({ workspaces, activeId, userName }: { workspaces: Workspace[]; activeId: string; userName: string }) {
  const router = useRouter();
  async function switchWorkspace(businessId: string) {
    if (!businessId || businessId === activeId) return;
    const response = await fetch("/api/businesses/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(result.error ?? "Workspace switch failed"); return; }
    toast.success("Workspace switched");
    router.refresh();
  }
  return <div className="flex items-center gap-3">
    {workspaces.length > 1 && <label className="sr-only" htmlFor="workspace-select">Switch workspace</label>}
    {workspaces.length > 1 ? <select id="workspace-select" value={activeId} onChange={(event) => void switchWorkspace(event.target.value)} className="max-w-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-700">{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <span className="hidden text-xs text-slate-500 sm:block">{workspaces[0]?.role}</span>}
    <div className="hidden h-8 w-px bg-slate-200 sm:block" />
    <div className="hidden text-right sm:block"><p className="max-w-36 truncate text-sm font-semibold text-slate-800">{userName}</p><p className="text-[11px] text-slate-400">Workspace member</p></div>
    <button onClick={() => void signOut({ callbackUrl: "/" })} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950" aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
  </div>;
}

export function RefreshButton() {
  const router = useRouter();
  return <button onClick={() => router.refresh()} className="button-secondary inline-flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>;
}
