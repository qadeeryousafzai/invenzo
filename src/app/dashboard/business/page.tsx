import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { getTenantContext } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export default async function BusinessProfilePage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("business.view")) return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold">Business profile unavailable</h1><p className="mt-2 text-sm text-slate-500">Your role does not allow access to business settings.</p></div>;
  const business = await prisma.business.findFirst({ where: { id: context.businessId, deletedAt: null }, select: { name: true, description: true, email: true, phone: true, address: true, taxId: true, website: true, currency: true, timezone: true, verificationStatus: true, type: true } });
  if (!business) redirect("/dashboard");
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">WORKSPACE SETTINGS</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><Building2 className="text-emerald-800" size={27} />Business profile</h1><p className="mt-2 text-sm text-slate-500">Keep your workspace identity and regional settings up to date.</p></div><BusinessProfileForm business={business} canManage={Boolean(context.permissions?.has("business.update"))} /></div>;
}
