import { redirect } from "next/navigation";
import { Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { RecordsManager } from "@/components/operations/records-manager";

export default async function CategoriesPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("products.view")) return <p className="surface-card p-8">Category access unavailable for this role.</p>;
  const rows = await prisma.category.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { name: "asc" }, take: 500 });
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">CATALOG</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><Tags className="text-emerald-800" />Categories</h1><p className="mt-2 text-sm text-slate-500">Organize products with workspace-specific categories.</p></div><RecordsManager kind="categories" rows={rows} canCreate={!!context.permissions.has("categories.manage")} /></div>;
}
