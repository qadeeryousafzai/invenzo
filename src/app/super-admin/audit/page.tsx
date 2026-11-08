import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";
import type { Prisma } from "@prisma/client";

export default async function AuditLogPage({ searchParams }: PageProps<"/super-admin/audit">) {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = 50;
  const where: Prisma.AuditLogWhereInput = query ? { OR: [{ action: { contains: query } }, { entity: { contains: query } }, { entityId: { contains: query } }, { business: { name: { contains: query } } }, { user: { OR: [{ name: { contains: query } }, { email: { contains: query } }] } }] } : {};
  const [total, unreadNotifications] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.notification.count({ where: { audience: "PLATFORM_ADMIN", OR: [{ userId: admin.id }, { userId: null }], readAt: null } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const events = await prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true } }, business: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (currentPage - 1) * pageSize, take: pageSize });
  const href = (nextPage: number) => `/super-admin/audit?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) }).toString()}`;
  return <div className="min-h-screen bg-[#f7f8f6]"><AdminHeader name={admin.name ?? admin.email ?? "Administrator"} unreadNotifications={unreadNotifications} /><main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8"><Link href="/super-admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={14} /> Back to super admin</Link><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><ClipboardList size={25} className="text-emerald-800" />Audit log</h1><p className="mt-2 text-sm text-slate-500">Administrative changes and important account activity.</p></div><form action="/super-admin/audit" className="flex gap-2"><label htmlFor="audit-q" className="sr-only">Search audit events</label><input id="audit-q" name="q" defaultValue={query} className="input-control mt-0 min-w-56 py-2.5 text-xs" placeholder="Action, user, business, ID" /><button className="button-primary py-2.5 text-xs">Search</button></form></div><section className="surface-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#fafbfa] text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Action</th><th className="px-5 py-3">Administrator / user</th><th className="px-5 py-3">Business</th><th className="px-5 py-3">Details</th><th className="px-5 py-3">When</th></tr></thead><tbody className="divide-y divide-slate-100">{events.map((event) => <tr key={event.id}><td className="px-5 py-4"><p className="font-semibold text-slate-800">{event.action.replaceAll(".", " ")}</p><p className="mt-1 text-[10px] text-slate-400">{event.entity}{event.entityId ? ` · ${event.entityId}` : ""}</p></td><td className="px-5 py-4 text-xs text-slate-600">{event.user?.name ?? event.user?.email ?? "System"}</td><td className="px-5 py-4">{event.business ? <Link href={`/super-admin/businesses/${event.business.id}`} className="text-xs font-semibold text-emerald-800 hover:underline">{event.business.name}</Link> : <span className="text-xs text-slate-400">Platform</span>}</td><td className="max-w-80 px-5 py-4 text-[10px] leading-4 text-slate-500">{event.metadata ? JSON.stringify(event.metadata) : "—"}</td><td className="whitespace-nowrap px-5 py-4 text-[10px] text-slate-500">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(event.createdAt)}</td></tr>)}</tbody></table>{!events.length && <p className="px-5 py-12 text-center text-sm text-slate-500">No audit events match this search.</p>}</div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">{total} event{total === 1 ? "" : "s"}</p><div className="flex items-center gap-2"><Link aria-disabled={currentPage <= 1} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${currentPage <= 1 ? "pointer-events-none opacity-45" : ""}`} href={href(Math.max(1, currentPage - 1))}><ChevronLeft size={14} /> Previous</Link><span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span><Link aria-disabled={currentPage >= totalPages} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${currentPage >= totalPages ? "pointer-events-none opacity-45" : ""}`} href={href(Math.min(totalPages, currentPage + 1))}>Next <ChevronRight size={14} /></Link></div></div></section></main></div>;
}
