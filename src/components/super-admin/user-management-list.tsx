"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Shield, ShieldOff, UserRoundX, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

type Account = {
  id: string;
  name: string | null;
  email: string;
  platformRole: "USER" | "SUPER_ADMIN";
  disabledAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  _count: { memberships: number };
};

const dateLabel = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

export function UserManagementList({ users, currentUserId }: { users: Account[]; currentUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function performAction(user: Account, action: "suspend" | "restore" | "archive" | "unarchive" | "grant_admin" | "revoke_admin" | "delete") {
    const prompts: Partial<Record<typeof action, string>> = {
      archive: `Archive ${user.email}? This is reversible and retains the account's data.`,
      grant_admin: `Grant ${user.email} full superadmin privileges?`,
      revoke_admin: `Remove superadmin privileges from ${user.email}?`,
    };
    const prompt = prompts[action];
    if (prompt && !window.confirm(prompt)) return;
    let confirmation: string | undefined;
    if (action === "delete") {
      const entered = window.prompt(`Permanently delete ${user.email}? This cannot be undone. Type the exact email to continue.`);
      if (entered !== user.email) return;
      confirmation = entered;
    }

    setBusy(user.id);
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirmation }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error ?? "Could not update account.");
        return;
      }
      const messages = {
        suspend: "Account suspended; its sessions are invalidated.",
        restore: "Account access restored.",
        archive: "Account archived; its data is retained.",
        unarchive: "Account restored.",
        grant_admin: "Superadmin privileges granted.",
        revoke_admin: "Superadmin privileges removed.",
        delete: "Account permanently deleted.",
      };
      toast.success(messages[action]);
      router.refresh();
    } catch {
      toast.error("Account could not be updated. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="surface-card-glass-strong overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Platform accounts</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Suspend sign-in, restore access, archive accounts reversibly, and manage superadmin privileges. The last active superadmin and your own account are protected.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="bg-[#fafbfa] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Workspaces</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isBusy = busy === user.id;
              const isSelf = currentUserId === user.id;
              const archived = Boolean(user.deletedAt);
              const suspended = Boolean(user.disabledAt) && !archived;
              const status = archived ? "archived" : suspended ? "suspended" : "active";
              return (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{user.name || "Unnamed user"}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">{user._count.memberships}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{user.platformRole === "SUPER_ADMIN" ? "Superadmin" : "Client user"}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${archived ? "bg-slate-200 text-slate-600" : suspended ? "bg-orange-50 text-orange-800" : "bg-emerald-50 text-emerald-800"}`}>{status}</span></td>
                  <td className="px-5 py-4 text-xs text-slate-600">{dateLabel(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {archived ? (
                        <>
                          <button className="button-secondary" disabled={Boolean(busy)} onClick={() => void performAction(user, "unarchive")}>{isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <UserRoundCheck size={14} />} Restore account</button>
                          {user._count.memberships === 0 && user.platformRole !== "SUPER_ADMIN" && <button className="button-secondary text-red-800" disabled={Boolean(busy) || isSelf} onClick={() => void performAction(user, "delete")}>Delete permanently</button>}
                        </>
                      ) : (
                        <>
                          {suspended
                            ? <button className="button-secondary inline-flex items-center gap-1.5" disabled={Boolean(busy)} onClick={() => void performAction(user, "restore")}>{isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <UserRoundCheck size={14} />} Restore access</button>
                            : <button className="button-secondary inline-flex items-center gap-1.5 text-orange-800" disabled={Boolean(busy) || isSelf} onClick={() => void performAction(user, "suspend")}>{isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <UserRoundX size={14} />} Suspend</button>}
                          <button className="button-secondary text-red-700" disabled={Boolean(busy) || isSelf} onClick={() => void performAction(user, "archive")}>Archive</button>
                          {user.platformRole === "SUPER_ADMIN"
                            ? <button className="button-secondary inline-flex items-center gap-1.5" disabled={Boolean(busy) || isSelf} onClick={() => void performAction(user, "revoke_admin")}>{isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldOff size={14} />} Revoke admin</button>
                            : <button className="button-secondary inline-flex items-center gap-1.5 text-emerald-800" disabled={Boolean(busy) || suspended} onClick={() => void performAction(user, "grant_admin")}>{isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Shield size={14} />} Make superadmin</button>}
                          {user._count.memberships === 0 && user.platformRole !== "SUPER_ADMIN" && <button className="button-secondary text-red-800" disabled={Boolean(busy) || isSelf} onClick={() => void performAction(user, "delete")}>Delete permanently</button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!users.length && <div className="px-5 py-12 text-center text-sm text-slate-500">No platform accounts found.</div>}
      </div>
    </section>
  );
}