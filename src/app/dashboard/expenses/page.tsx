import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { RecordsManager } from "@/components/operations/records-manager";

export default async function ExpensesPage() {
  const context = await getTenantContext(); if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("finance.view")) return <p className="surface-card p-8">Finance access unavailable for this role.</p>;
  const [rows, business] = await Promise.all([prisma.expense.findMany({ where: { businessId: context.businessId }, orderBy: { incurredAt: "desc" }, take: 500 }), prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } })]);
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-black">FINANCE</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-black"><ReceiptText className="text-black" />Expenses</h1><p className="mt-2 text-sm text-gray-600">Record operating costs for your reports.</p></div><RecordsManager kind="expenses" rows={rows.map((row) => ({ ...row, amount: row.amount.toString() }))} canCreate={!!context.permissions.has("expenses.manage")} currency={business?.currency ?? "USD"} /></div>;
}
