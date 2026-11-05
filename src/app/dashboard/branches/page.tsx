import { redirect } from "next/navigation";
import { Building2, MapPin, Warehouse } from "lucide-react";
import { CreateBranchForm } from "@/components/branches/create-branch-form";
import { BranchActions } from "@/components/branches/branch-actions";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function BranchesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.membership || !context.permissions?.has("branches.view")) return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold">Branch access unavailable</h1><p className="mt-2 text-sm text-slate-500">Your assigned role does not include branch viewing permission.</p></div>;
  const [branches, members] = await Promise.all([
    prisma.branch.findMany({ where: { businessId: context.businessId, deletedAt: null }, include: { manager: { select: { name: true, email: true } }, _count: { select: { warehouses: { where: { deletedAt: null } } } } }, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({ where: { businessId: context.businessId, status: "ACTIVE" }, select: { user: { select: { id: true, name: true, email: true } } } }),
  ]);
  const managers = members.map(({ user }) => user);
  const canManage = context.permissions.has("branches.manage");
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">LOCATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Branches & warehouses</h1><p className="mt-2 text-sm text-slate-500">Manage physical locations and their assigned workspace managers.</p></div><CreateBranchForm managers={managers} canManage={canManage} /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{branches.map((branch) => <article key={branch.id} className="surface-card p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Building2 size={19} /></span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${branch.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{branch.status.toLowerCase()}</span></div><div className="mt-5"><div className="flex items-center gap-2"><h2 className="truncate text-base font-semibold text-slate-900">{branch.name}</h2><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">{branch.code}</span></div><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 shrink-0" size={14} />{branch.address || "No address added"}</p><p className="mt-2 text-xs text-slate-500">Manager: {branch.manager?.name || branch.manager?.email || "Unassigned"}</p></div><div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600"><Warehouse size={15} className="text-slate-400" />{branch._count.warehouses} warehouse{branch._count.warehouses === 1 ? "" : "s"}</div><BranchActions branch={{ id: branch.id, name: branch.name, code: branch.code, phone: branch.phone, address: branch.address, managerId: branch.managerId, latitude: branch.latitude?.toString() ?? null, longitude: branch.longitude?.toString() ?? null, status: branch.status }} managers={managers} canManage={canManage} /></article>)}
      {!branches.length && <div className="surface-card col-span-full px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Building2 size={23} /></span><h2 className="mt-4 font-semibold text-slate-900">Your locations start here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add branches to organize your business. A main warehouse is created with each new location.</p></div>}
    </div></div>;
}
