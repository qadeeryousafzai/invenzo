import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { RecordsManager } from "@/components/operations/records-manager";

export default async function SuppliersPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("purchases.manage")) return <p className="surface-card p-8">Supplier access unavailable for this role.</p>;
  const rows = await prisma.supplier.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { name: "asc" }, take: 500 });
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-black">RELATIONSHIPS</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-black"><Truck className="text-black" />Suppliers</h1><p className="mt-2 text-sm text-gray-600">Keep supplier contacts available for received purchases.</p></div><RecordsManager kind="suppliers" rows={rows} canCreate={!!context.permissions.has("suppliers.manage")} /></div>;
}
