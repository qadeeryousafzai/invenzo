import Link from "next/link";
import { ArrowRight, Building2, CircleCheck, Clock3, ShieldCheck, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePageTenant } from "@/lib/tenant-context";

const dateLabel = (date: Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);

export default async function DashboardPage() {
  const context = await requirePageTenant();
  if (!context.businessId || !context.membership) return null;
  if (!context.permissions?.has("business.view")) return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold">Workspace overview unavailable</h1><p className="mt-2 text-sm text-slate-500">Your assigned role does not include business viewing permission.</p></div>;
  const businessId = context.businessId;
  const canViewBranches = context.permissions.has("branches.view");
  const canViewEmployees = context.permissions.has("employees.view");
  const [branchCount, employeeCount, branches, activity, session] = await Promise.all([
    canViewBranches ? prisma.branch.count({ where: { businessId, deletedAt: null, status: "ACTIVE" } }) : Promise.resolve(0),
    canViewEmployees ? prisma.membership.count({ where: { businessId, status: "ACTIVE" } }) : Promise.resolve(0),
    canViewBranches ? prisma.branch.findMany({ where: { businessId, deletedAt: null }, select: { id: true, name: true, code: true, address: true, status: true, _count: { select: { warehouses: { where: { deletedAt: null } } } } }, orderBy: { createdAt: "asc" }, take: 4 }) : Promise.resolve([]),
    context.permissions.has("business.view") ? prisma.auditLog.findMany({ where: { businessId }, select: { id: true, action: true, entity: true, createdAt: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 5 }) : Promise.resolve([]),
    auth(),
  ]);
  const business = context.membership.business;
  const greetingName = session?.user.name?.split(" ")[0] ?? "there";
  const stats = [
    { label: "Active branches", value: canViewBranches ? branchCount : "—", detail: canViewBranches ? "Locations in this workspace" : "Requires branch-view permission", icon: Building2, tint: "bg-blue-50 text-blue-700" },
    { label: "Team members", value: canViewEmployees ? employeeCount : "—", detail: canViewEmployees ? "Active workspace access" : "Requires team-view permission", icon: UsersRound, tint: "bg-violet-50 text-violet-700" },
    { label: "Business profile", value: business.verificationStatus === "VERIFIED" ? "Verified" : "Pending", detail: "Platform verification status", icon: business.verificationStatus === "VERIFIED" ? CircleCheck : Clock3, tint: business.verificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700" },
  ];
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(new Date())}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Good to see you, {greetingName}.</h1><p className="mt-2 text-sm text-slate-500">Here’s the foundation of your {business.name} workspace.</p></div><Link href="/dashboard/branches" className="button-primary">Manage branches <ArrowRight size={16} /></Link></div>
    <section className="grid gap-4 md:grid-cols-3">{stats.map(({ label, value, detail, icon: Icon, tint }) => <article key={label} className="surface-card p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`grid size-9 place-items-center rounded-xl ${tint}`}><Icon size={18} /></span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>)}</section>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Your branches</h2><p className="mt-1 text-xs text-slate-500">Locations in this workspace</p></div><Link href="/dashboard/branches" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">View all</Link></div>{branches.length ? <div className="divide-y divide-slate-100">{branches.map((branch) => <div key={branch.id} className="flex items-center gap-3 px-5 py-4"><span className="grid size-9 place-items-center rounded-xl bg-[#f0f5f1] text-emerald-800"><Building2 size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{branch.name}</p><p className="mt-1 truncate text-xs text-slate-500">{branch.address || `${branch.code} · ${branch._count.warehouses} warehouse${branch._count.warehouses === 1 ? "" : "s"}`}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${branch.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{branch.status.toLowerCase()}</span></div>)}</div> : <div className="px-5 py-10 text-center text-sm text-slate-500">No branches yet. Add your first location to get started.</div>}</section>
      <section className="surface-card overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Auditable workspace events</p></div>{activity.length ? <div className="divide-y divide-slate-100">{activity.map((event) => <div key={event.id} className="flex gap-3 px-5 py-4"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#f1f5f2] text-emerald-800"><ShieldCheck size={15} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{event.action.replaceAll(".", " ")}</p><p className="mt-1 text-[11px] text-slate-500">{event.user?.name ?? event.user?.email ?? "System"} · {dateLabel(event.createdAt)}</p></div></div>)}</div> : <div className="px-5 py-10 text-center text-sm text-slate-500">Workspace activity will appear here as your team works.</div>}</section>
    </div>
    <section className="flex flex-col gap-3 rounded-2xl border border-[#dce9df] bg-[#f0f6f1] p-5 sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-800"><ShieldCheck size={19} /></span><div className="flex-1"><h2 className="text-sm font-semibold text-slate-900">Built on a secure foundation</h2><p className="mt-1 text-xs leading-5 text-slate-600">Your team’s role permissions and workspace membership are checked on every private server request. Inventory and sales modules are coming in a later phase.</p></div><Link href="/dashboard/employees" className="shrink-0 text-sm font-semibold text-emerald-800">Manage team <ArrowRight className="ml-1 inline" size={14} /></Link></section>
  </div>;
}
