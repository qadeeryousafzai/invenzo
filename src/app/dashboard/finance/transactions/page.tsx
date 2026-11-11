import { redirect } from "next/navigation";
import { ArrowRightLeft, TrendingUp, ReceiptText, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

type LedgerRow = { id: string; type: "INCOME" | "EXPENSE" | "SALE" | "PURCHASE"; reference: string; contact: string; date: string; amount: number };

export default async function FinanceTransactionsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("finance.view")) return <p className="surface-card p-8 text-slate-700">Finance access unavailable for this role.</p>;

  const [incomes, expenses, sales, purchases, business] = await Promise.all([
    prisma.income.findMany({ where: { businessId: context.businessId }, orderBy: { date: "desc" }, take: 200 }),
    prisma.expense.findMany({ where: { businessId: context.businessId }, orderBy: { incurredAt: "desc" }, take: 200 }),
    prisma.sale.findMany({ where: { businessId: context.businessId }, select: { id: true, reference: true, total: true, soldAt: true, customer: { select: { name: true } } }, orderBy: { soldAt: "desc" }, take: 200 }),
    prisma.purchase.findMany({ where: { businessId: context.businessId }, select: { id: true, reference: true, total: true, purchasedAt: true, supplier: { select: { name: true } } }, orderBy: { purchasedAt: "desc" }, take: 200 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true } }),
  ]);

  const currency = business?.currency ?? "USD";
  const ledger: LedgerRow[] = [
    ...incomes.map((row) => ({ id: `income-${row.id}`, type: "INCOME" as const, reference: row.reference ?? row.title, contact: row.category, date: row.date.toISOString(), amount: Number(row.amount) })),
    ...expenses.map((row) => ({ id: `expense-${row.id}`, type: "EXPENSE" as const, reference: row.title, contact: row.category, date: row.incurredAt.toISOString(), amount: Number(row.amount) })),
    ...sales.map((row) => ({ id: `sale-${row.id}`, type: "SALE" as const, reference: row.reference, contact: row.customer?.name ?? "Walk-in", date: row.soldAt.toISOString(), amount: Number(row.total) })),
    ...purchases.map((row) => ({ id: `purchase-${row.id}`, type: "PURCHASE" as const, reference: row.reference, contact: row.supplier?.name ?? "Unspecified", date: row.purchasedAt.toISOString(), amount: Number(row.total) })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isInflow = (type: LedgerRow["type"]) => type === "INCOME" || type === "SALE";
  const totalInflow = ledger.filter((row) => isInflow(row.type)).reduce((sum, row) => sum + row.amount, 0);
  const totalOutflow = ledger.filter((row) => !isInflow(row.type)).reduce((sum, row) => sum + row.amount, 0);
  const net = totalInflow - totalOutflow;

  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const badge: Record<LedgerRow["type"], string> = {
    INCOME: "bg-[#f1fce0] text-[#003d32]",
    SALE: "bg-[#eef6ff] text-[#1d4ed8]",
    EXPENSE: "bg-[#fff4e6] text-[#b45309]",
    PURCHASE: "bg-[#f3e8ff] text-[#7c3aed]",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Finance</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><ArrowRightLeft className="h-5 w-5" /></span>Transactions</h1>
        <p className="mt-2 text-sm text-slate-500">A unified ledger of every income, sale, expense, and purchase in this workspace.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-slate-500"><TrendingUp className="h-4 w-4 text-[#16a34a]" /><p className="text-xs font-medium">Total inflow</p></div><p className="mt-2 text-2xl font-semibold text-[#16a34a]">{money(totalInflow)}</p><p className="mt-1 text-xs text-slate-500">Income + sales</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-slate-500"><ReceiptText className="h-4 w-4 text-[#b45309]" /><p className="text-xs font-medium">Total outflow</p></div><p className="mt-2 text-2xl font-semibold text-[#b45309]">{money(totalOutflow)}</p><p className="mt-1 text-xs text-slate-500">Expenses + purchases</p></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2 text-slate-500"><Wallet className="h-4 w-4 text-[#1d4ed8]" /><p className="text-xs font-medium">Net cash flow</p></div><p className={`mt-2 text-2xl font-semibold ${net >= 0 ? "text-[#16a34a]" : "text-red-600"}`}>{money(net)}</p><p className="mt-1 text-xs text-slate-500">Inflow minus outflow</p></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-5 py-4"><h2 className="font-semibold text-slate-900">All transactions</h2><p className="mt-1 text-xs text-slate-500">{ledger.length} ledger entr{ledger.length === 1 ? "y" : "ies"}, newest first.</p></div>
        {ledger.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Counterparty</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fafc]/70">
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[row.type]}`}>{row.type}</span></td>
                    <td className="px-5 py-4 font-medium text-slate-900">{row.reference}</td>
                    <td className="px-5 py-4 text-slate-600">{row.contact}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(row.date).toLocaleDateString()}</td>
                    <td className={`px-5 py-4 text-right font-semibold ${isInflow(row.type) ? "text-[#16a34a]" : "text-[#b45309]"}`}>{isInflow(row.type) ? "+" : "−"}{money(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><ArrowRightLeft className="mx-auto h-10 w-10 text-[#cddbcb]" /><p className="mt-3 font-semibold text-slate-900">No transactions yet</p><p className="mt-2 text-sm text-slate-500">Sales, purchases, expenses, and income will appear here.</p></div>
        )}
      </section>
    </div>
  );
}