import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Clock3, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { BusinessActions } from "@/components/super-admin/business-actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";

const dateLabel = (date: Date | null) => date ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Not set";

export default async function BusinessManagementPage({ params }: PageProps<"/super-admin/businesses/[businessId]">) {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const { businessId } = await params;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
      memberships: { where: { role: { key: "OWNER" } }, take: 1, include: { user: { select: { id: true, name: true, email: true, createdAt: true, emailVerified: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 50, include: { actor: { select: { name: true, email: true } } } },
      auditLogs: { where: { entity: "business" }, orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true, email: true } } } },
      _count: { select: { memberships: true, branches: true, products: true } },
    },
  });
  if (!business) notFound();
  const now = new Date();
  const status = getWorkspaceAccessStatus(business, now);
  const owner = business.memberships[0]?.user ?? null;
  const remainingDays = business.subscriptionExpiresAt && status === "ACTIVE"
    ? Math.max(0, Math.ceil((business.subscriptionExpiresAt.getTime() - now.getTime()) / 86_400_000))
    : 0;
  const activity = [
    { label: "Team members", value: business._count.memberships },
    { label: "Branches", value: business._count.branches },
    { label: "Products", value: business._count.products },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8 sm:py-9">
      <Link href="/super-admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={14} /> Back to business management
      </Link>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <section className="surface-card min-w-0 flex-1 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Building2 size={21} /></span>
              <div>
                <p className="text-[10px] font-bold tracking-[.14em] text-slate-400">BUSINESS ACCOUNT</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{business.name}</h1>
                <p className="mt-1 text-xs capitalize text-slate-500">{business.type.replaceAll("_", " ").toLowerCase()} · {business.slug}</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              {status.toLowerCase().replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Info icon={UserRound} label="Owner" value={owner?.name || "Owner account unavailable"} detail={owner?.email ?? "—"} />
            <Info icon={Mail} label="Business email" value={business.email ?? "Not provided"} detail={owner?.email && owner.email !== business.email ? `Owner login: ${owner.email}` : "Owner contact"} />
            <Info icon={Phone} label="Phone" value={business.phone ?? "Not provided"} detail={business.address ?? "Address not provided"} />
            <Info icon={CalendarDays} label="Registration date" value={dateLabel(business.createdAt)} detail="Application submitted" />
            <Info icon={ShieldCheck} label="Activation date" value={dateLabel(business.subscriptionStartedAt)} detail={business.approvedBy ? `Approved by ${business.approvedBy.name ?? business.approvedBy.email}` : "No approving administrator recorded"} />
            <Info icon={Clock3} label="Account expiry" value={dateLabel(business.subscriptionExpiresAt)} detail={status === "ACTIVE" ? `${remainingDays} day${remainingDays === 1 ? "" : "s"} remaining` : status === "EXPIRED" ? "Access period ended" : "Not currently active"} />
          </div>

          {business.address && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" />{business.address}</p>}
          {business.description && <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{business.description}</p>}
          {(business.statusReason || business.rejectionReason) && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">Current account reason</p><p className="mt-1 text-xs leading-5 text-amber-950">{business.rejectionReason || business.statusReason}</p></div>}
        </section>
        <div className="w-full lg:max-w-[370px]"><BusinessActions businessId={business.id} businessName={business.name} status={status} statusUntil={business.statusUntil?.toISOString() ?? null} /></div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">{activity.map(({ label, value }) => <article key={label} className="surface-card p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></article>)}</section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Account history</h2><p className="mt-1 text-xs text-slate-500">Status transitions, reasons, and the administrator or system that recorded them.</p></div>
        {business.statusHistory.length ? <ol className="divide-y divide-slate-100">{business.statusHistory.map((entry) => <li key={entry.id} className="flex gap-3 px-5 py-4"><span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-slate-800">{entry.previousStatus ? `${entry.previousStatus.replaceAll("_", " ")} → ` : ""}{entry.newStatus.replaceAll("_", " ")}</p><span className="text-[10px] text-slate-400">{dateLabel(entry.createdAt)}</span></div><p className="mt-1 text-[11px] text-slate-500">{entry.actor?.name ?? entry.actor?.email ?? "System"}{entry.reason ? ` · ${entry.reason}` : ""}</p></div></li>)}</ol> : <p className="px-5 py-10 text-center text-sm text-slate-500">No account history recorded.</p>}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Administrative audit log</h2><p className="mt-1 text-xs text-slate-500">Business account actions are retained as platform audit records.</p></div>
        {business.auditLogs.length ? <div className="divide-y divide-slate-100">{business.auditLogs.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><div><p className="text-xs font-semibold text-slate-700">{entry.action.replaceAll(".", " ")}</p><p className="mt-1 text-[10px] text-slate-500">{entry.user?.name ?? entry.user?.email ?? "System"}</p></div><time className="text-[10px] text-slate-400">{dateLabel(entry.createdAt)}</time></div>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">No administrative audit entries.</p>}
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value, detail }: { icon: typeof Building2; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-100 bg-[#fcfdfb] p-3.5"><div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400"><Icon size={13} />{label}</div><p className="mt-2 truncate text-xs font-semibold text-slate-800">{value}</p><p className="mt-1 truncate text-[10px] text-slate-500">{detail}</p></div>;
}