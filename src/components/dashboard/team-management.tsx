"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, MailPlus, ShieldCheck, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS, type PermissionKey } from "@/modules/businesses/permissions";

type Role = { id: string; key: string; name: string; isSystem: boolean; permissions: { permissionKey: string }[] };
type Employee = { id: string; status: string; joinedAt: string; user: { id: string; name: string | null; email: string }; role: { id: string; name: string; key: string } };
type Invite = { id: string; email: string; expiresAt: string; role: { name: string } };

export function TeamManagement({ roles, employees, invitations, canInvite, canCreateRoles }: { roles: Role[]; employees: Employee[]; invitations: Invite[]; canInvite: boolean; canCreateRoles: boolean }) {
  const router = useRouter();
  const [inviteBusy, setInviteBusy] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [memberBusy, setMemberBusy] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>(["business.view"]);
  const [roleFormOpen, setRoleFormOpen] = useState(false);

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setInviteBusy(true); setInviteError("");
    const response = await fetch("/api/employees/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.get("email"), roleId: values.get("roleId") }) });
    const result = await response.json().catch(() => ({}));
    setInviteBusy(false);
    if (!response.ok) { setInviteError(result.error ?? "Invitation could not be sent."); return; }
    toast.success("Invitation email sent");
    form.reset();
    router.refresh();
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    setRoleBusy(true); setRoleError("");
    const response = await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, permissions: selectedPermissions }) });
    const result = await response.json().catch(() => ({}));
    setRoleBusy(false);
    if (!response.ok) { setRoleError(result.error ?? "Role could not be created."); return; }
    toast.success("Custom role created");
    setRoleFormOpen(false);
    setSelectedPermissions(["business.view"]);
    router.refresh();
  }

  function togglePermission(key: PermissionKey) {
    if (key === "business.view") return;
    setSelectedPermissions((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  }

  async function setMemberStatus(membershipId: string, status: "ACTIVE" | "SUSPENDED") {
    setMemberBusy(membershipId);
    const response = await fetch(`/api/employees/${membershipId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => ({})); setMemberBusy("");
    if (!response.ok) { toast.error(result.error ?? "Membership could not be updated"); return; }
    toast.success(status === "ACTIVE" ? "Workspace access restored" : "Workspace access suspended"); router.refresh();
  }

  const assignableRoles = roles.filter((role) => role.key !== "OWNER");
  return <div className="space-y-6">
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <section className="surface-card p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gray-100 text-black"><UserRoundPlus size={19} /></span><div><h2 className="font-semibold text-black">Invite a teammate</h2><p className="mt-1 text-xs leading-5 text-gray-600">They must verify their email and sign in with the invited address to accept.</p></div></div>{canInvite ? <form onSubmit={sendInvite} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"><label className="field-label">Email<input className="input-control" name="email" type="email" required placeholder="teammate@company.com" /></label><label className="field-label">Role<select className="input-control" name="roleId" required defaultValue=""><option value="" disabled>Select role</option>{assignableRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label><div className="flex items-end"><button className="button-primary w-full sm:w-auto" disabled={inviteBusy}>{inviteBusy ? <LoaderCircle size={16} className="animate-spin" /> : <MailPlus size={16} />} Invite</button></div>{inviteError && <p role="alert" className="alert-error sm:col-span-3">{inviteError}</p>}</form> : <p className="mt-5 text-sm text-gray-600">Your role does not include employee management permission.</p>}</section>
      <section className="surface-card p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={19} /></span><div><h2 className="font-semibold text-black">Workspace roles</h2><p className="mt-1 text-xs text-gray-600">{roles.length} roles configured with individual permissions.</p></div></div>{canCreateRoles && <button className="button-secondary shrink-0" onClick={() => setRoleFormOpen((open) => !open)}>{roleFormOpen ? "Close" : "New role"}</button>}</div>{roleFormOpen && <form onSubmit={createRole} className="mt-5"><label className="field-label">Role name<input className="input-control" name="name" minLength={2} maxLength={100} required placeholder="Regional supervisor" /></label><p className="mb-2 mt-4 text-xs font-semibold text-gray-600">Permissions</p><div className="grid gap-2 sm:grid-cols-2">{Object.entries(PERMISSIONS).map(([key, description]) => <label key={key} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 p-2.5 text-xs text-gray-600"><input type="checkbox" checked={selectedPermissions.includes(key as PermissionKey)} disabled={key === "business.view"} onChange={() => togglePermission(key as PermissionKey)} className="mt-0.5 accent-[#175b45]" /><span><span className="block font-semibold text-gray-700">{key}</span><span className="mt-0.5 block leading-4 text-gray-600">{description}</span></span></label>)}</div>{roleError && <p role="alert" className="alert-error mt-3">{roleError}</p>}<button className="button-primary mt-4" disabled={roleBusy}>{roleBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Save role</button></form>}{!roleFormOpen && <div className="mt-5 flex flex-wrap gap-2">{roles.map((role) => <span key={role.id} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">{role.name} <span className="ml-1 text-gray-500">· {role.permissions.length}</span></span>)}</div>}</section>
    </div>
    <section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-gray-200 px-5 py-4"><div><h2 className="font-semibold text-black">Workspace members</h2><p className="mt-1 text-xs text-gray-600">Access is scoped to this business.</p></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{employees.length} members</span></div><div className="overflow-x-auto"><table className="w-full min-w-170 text-left text-sm"><thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-semibold">Person</th><th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Joined</th>{canInvite && <th className="px-5 py-3 font-semibold">Access</th>}</tr></thead><tbody className="divide-y divide-slate-100">{employees.map((employee) => <tr key={employee.id}><td className="px-5 py-4"><p className="font-semibold text-black">{employee.user.name || "Team member"}</p><p className="mt-0.5 text-xs text-gray-600">{employee.user.email}</p></td><td className="px-5 py-4 text-gray-600">{employee.role.name}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${employee.status === "ACTIVE" ? "bg-gray-100 text-black" : "bg-gray-100 text-gray-600"}`}>{employee.status.toLowerCase()}</span></td><td className="px-5 py-4 text-xs text-gray-600">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(employee.joinedAt))}</td>{canInvite && <td className="px-5 py-4">{employee.role.key !== "OWNER" && <button className="button-secondary text-xs" disabled={Boolean(memberBusy)} onClick={() => void setMemberStatus(employee.id, employee.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>{memberBusy === employee.id ? <LoaderCircle size={13} className="animate-spin" /> : employee.status === "ACTIVE" ? "Suspend access" : "Restore access"}</button>}</td>}</tr>)}</tbody></table></div></section>
    <section className="surface-card overflow-hidden"><div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-black">Pending invitations</h2><p className="mt-1 text-xs text-gray-600">Invitation links expire after seven days.</p></div>{invitations.length ? <div className="divide-y divide-slate-100">{invitations.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><div><p className="text-sm font-medium text-black">{invite.email}</p><p className="mt-1 text-xs text-gray-600">{invite.role.name}</p></div><p className="text-xs text-gray-600">Expires {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(invite.expiresAt))}</p></div>)}</div> : <p className="px-5 py-8 text-sm text-gray-600">No pending invitations.</p>}</section>
  </div>;
}
