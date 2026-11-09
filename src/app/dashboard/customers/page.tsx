import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { RecordsManager } from "@/components/operations/records-manager";

export default async function CustomersPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("sales.view")) return <p className="surface-card p-8">Customer access unavailable for this role.</p>;
  const rows = await prisma.customer.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 500 });
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">RELATIONSHIPS</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><UserRound className="text-emerald-800" />Customers</h1><p className="mt-2 text-sm text-slate-500">Maintain your customer directory and link customers to sales.</p></div><RecordsManager kind="customers" rows={rows} canCreate={!!context.permissions.has("customers.manage")} /></div>;
}
