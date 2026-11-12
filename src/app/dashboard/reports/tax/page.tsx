import { redirect } from "next/navigation";
import { FileText, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function TaxReportsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("reports.view")) return <p className="surface-card p-8">Reports access unavailable for this role.</p>;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const inThisMonth = (date: Date) => date >= startOfMonth;

  const [sales, purchases, expenses, business] = await Promise.all([
    prisma.sale.findMany({ where: { businessId: context.businessId }, select: { reference: true, total: true, soldAt: true }, orderBy: { soldAt: "desc" }, take: 500 }),
    prisma.purchase.findMany({ where: { businessId: context.businessId }, select: { reference: true, total: true, purchasedAt: true }, orderBy: { purchasedAt: "desc" }, take: 500 }),
    prisma.expense.findMany({ where: { businessId: context.businessId }, select: { title: true, amount: true, incurredAt: true }, orderBy: { incurredAt: "desc" }, take: 500 }),
    prisma.business.findUnique({ where: { id: context.businessId }, select: { currency: true, taxId: true } }),
  ]);

  const currency = business?.currency ?? "PKR";
  const salesThisMonth = sales.filter((row) => inThisMonth(row.soldAt));
  const purchasesThisMonth = purchases.filter((row) => inThisMonth(row.purchasedAt));
  const expensesThisMonth = expenses.filter((row) => inThisMonth(row.incurredAt));

  const salesTaxable = salesThisMonth.reduce((sum, row) => sum + Number(row.total), 0);
  const purchaseTaxable = purchasesThisMonth.reduce((sum, row) => sum + Number(row.total), 0);
  const expenseTotal = expensesThisMonth.reduce((sum, row) => sum + Number(row.amount), 0);
  const netTaxable = salesTaxable - purchaseTaxable - expenseTotal;

  const money = (value: number) => `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    { label: "Taxable sales", value: money(salesTaxable), detail: `${salesThisMonth.length} sales this month`, icon: ReceiptText, tone: "text-[#16a34a]" },
    { label: "Taxable purchases", value: money(purchaseTaxable), detail: `${purchasesThisMonth.length} purchases this month`, icon: ReceiptText, tone: "text-[#7c3aed]" },
    { label: "Operating expenses", value: money(expenseTotal), detail: `${expensesThisMonth.length} expenses this month`, icon: ReceiptText, tone: "text-[#b45309]" },
    { label: "Net taxable base", value: money(netTaxable), detail: "Sales less purchases and expenses", icon: FileText, tone: netTaxable >= 0 ? "text-[#16a34a]" : "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Reports</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#16a34a]"><FileText className="h-5 w-5" /></span>Tax Reports</h1>
        <p className="mt-2 text-sm text-slate-500">A tax-ready summary of this month&apos;s sales, purchases, and expenses for your records.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="surface-card p-5"><div className="flex items-center gap-2 text-slate-500"><Icon className={`h-4 w-4 ${card.tone}`} /><p className="text-xs font-medium">{card.label}</p></div><p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p><p className="mt-1 text-xs text-slate-500">{card.detail}</p></div>; })}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4"><div><h2 className="font-semibold text-slate-900">Tax basis summary</h2><p className="mt-1 text-xs text-slate-500">{business?.taxId ? `Tax ID: ${business.taxId}` : "No tax ID configured on this business."}</p></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Count</th><th className="px-5 py-3 font-semibold text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              <tr><td className="px-5 py-4 font-medium text-slate-900">Sales revenue</td><td className="px-5 py-4 text-slate-600">{salesThisMonth.length}</td><td className="px-5 py-4 text-right font-semibold text-[#16a34a]">{money(salesTaxable)}</td></tr>
              <tr><td className="px-5 py-4 font-medium text-slate-900">Purchase spend</td><td className="px-5 py-4 text-slate-600">{purchasesThisMonth.length}</td><td className="px-5 py-4 text-right font-semibold text-[#7c3aed]">{money(purchaseTaxable)}</td></tr>
              <tr><td className="px-5 py-4 font-medium text-slate-900">Operating expenses</td><td className="px-5 py-4 text-slate-600">{expensesThisMonth.length}</td><td className="px-5 py-4 text-right font-semibold text-[#b45309]">{money(expenseTotal)}</td></tr>
              <tr className="bg-[#f8fafc]"><td className="px-5 py-4 font-semibold text-slate-900">Net taxable base</td><td className="px-5 py-4" /><td className={`px-5 py-4 text-right font-bold ${netTaxable >= 0 ? "text-[#16a34a]" : "text-red-600"}`}>{money(netTaxable)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e5e7eb] px-5 py-3 text-xs text-slate-500">Figures cover the current calendar month. Apply your local tax rate to the net taxable base to estimate tax due.</div>
      </section>
    </div>
  );
}