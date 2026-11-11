import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { IncomeManager } from "@/components/operations/income-manager";

export default async function IncomePage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("finance.view")) return <p className="surface-card p-8 text-slate-700">Finance access unavailable for this role.</p>;
  const [rows, business] = await Promise.all([
    prisma.income.findMany({ where: { businessId: context.businessId }, orderBy: { date: "desc" }, take: 500 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Finance</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><Wallet className="h-5 w-5" /></span>Income</h1>
        <p className="mt-2 text-sm text-slate-500">Record revenue from services and other income sources and keep your finance records complete.</p>
      </div>
      <IncomeManager rows={rows.map((row) => ({ ...row, amount: row.amount.toString(), date: row.date.toISOString(), createdAt: row.createdAt.toISOString() }))} canManage={context.permissions.has("finance.view")} currency={business?.currency ?? "USD"} />
    </div>
  );
}