import { redirect } from "next/navigation";
import { ChartNoAxesCombined } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { ReportsDashboard } from "@/components/operations/reports-dashboard";

export default async function ReportsPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("reports.view")) return <p className="surface-card p-8">Reports access unavailable for this role.</p>;
  const business = await prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } });
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">BUSINESS INTELLIGENCE</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><ChartNoAxesCombined className="text-emerald-800" />Reports</h1><p className="mt-2 text-sm text-slate-500">Review sales, purchasing, expenses, and inventory signals for your workspace.</p></div><ReportsDashboard currency={business?.currency ?? "USD"} /></div>;
}
