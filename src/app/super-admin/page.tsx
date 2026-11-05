import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Building2, CircleCheck, Clock3, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { VerificationList } from "@/components/super-admin/verification-list";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.platformRole !== "SUPER_ADMIN") redirect("/dashboard");
  const [businessCount, userCount, activeBusinessCount, pendingVerificationCount, businesses] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { disabledAt: null } }),
    prisma.business.count({ where: { deletedAt: null, verificationStatus: "VERIFIED" } }),
    prisma.business.count({ where: { deletedAt: null, verificationStatus: "PENDING" } }),
    prisma.business.findMany({ where: { deletedAt: null }, select: { id: true, name: true, type: true, email: true, createdAt: true, verificationStatus: true, _count: { select: { memberships: true, branches: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const stats = [
    { label: "Business workspaces", value: businessCount, note: "Registered on the platform", icon: Building2, tint: "bg-blue-50 text-blue-700" },
    { label: "Registered users", value: userCount, note: "Accounts not disabled", icon: UsersRound, tint: "bg-violet-50 text-violet-700" },
    { label: "Verified businesses", value: activeBusinessCount, note: "Approved platform access", icon: CircleCheck, tint: "bg-emerald-50 text-emerald-700" },
    { label: "Pending review", value: pendingVerificationCount, note: "Awaiting verification", icon: Clock3, tint: "bg-amber-50 text-amber-700" },
  ];
  return <div className="min-h-screen bg-[#f7f8f6]"><AdminHeader name={session.user.name ?? session.user.email ?? "Administrator"} /><main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10"><div><p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM OPERATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Super admin</h1><p className="mt-2 text-sm text-slate-500">Platform-level workspace and account administration. Private business operations remain isolated.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, note, icon: Icon, tint }) => <article key={label} className="surface-card p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`grid size-9 place-items-center rounded-xl ${tint}`}><Icon size={18} /></span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}</section><VerificationList businesses={businesses.map((business) => ({ ...business, createdAt: business.createdAt.toISOString() }))} /><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Coming in later phases</h2><p className="mt-2 text-sm leading-6 text-slate-500">Subscription billing, recurring revenue metrics, support tickets, platform announcements, and advanced activity reporting are not implemented yet.</p></section></main></div>;
}
