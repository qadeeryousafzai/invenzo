import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
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
  const [total, events] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true } }, business: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const href = (nextPage: number) => `/super-admin/audit?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) }).toString()}`;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
      <Link href="/super-admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={14} /> Back to super admin
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950">
            <ClipboardList size={25} className="text-emerald-800" />Audit log
          </h1>
          <p className="mt-2 text-sm text-slate-500">Administrative changes and important account activity.</p>
        </div>
        <form action="/super-admin/audit" className="flex gap-2">
          <label htmlFor="audit-q" className="sr-only">Search audit events</label>
          <input id="audit-q" name="q" defaultValue={query} className="input-control mt-0 min-w-56 py-2.5 text-xs" placeholder="Action, user, business, ID" />
          <button className="button-primary py-2.5 text-xs">Search</button>
        </form>
      </div>
      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#fafbfa] text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Administrator / user</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{event.action.replaceAll(".", " ")}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{event.entity}{event.entityId ? ` · ${event.entityId}` : ""}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {event.user ? `${event.user.name || "—"} (${event.user.email})` : "System"}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {event.business ? <Link href={`/super-admin/businesses/${event.business.id}`} className="text-emerald-700 hover:underline">{event.business.name}</Link> : "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">{event.metadata ? JSON.stringify(event.metadata) : "—"}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {new Date(event.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">No audit events match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">{total ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} of ${total} events` : "No audit events found"}</p>
          <div className="flex items-center gap-2">
            <Link aria-disabled={currentPage <= 1} href={href(Math.max(1, currentPage - 1))} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${currentPage <= 1 ? "pointer-events-none opacity-45" : ""}`}>
              <ChevronLeft size={14} /> Previous
            </Link>
            <span className="px-2 text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
            <Link aria-disabled={currentPage >= totalPages} href={href(Math.min(totalPages, currentPage + 1))} className={`button-secondary inline-flex items-center gap-1 py-2 text-xs ${currentPage >= totalPages ? "pointer-events-none opacity-45" : ""}`}>
              Next <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}