import Link from "next/link";
export default function FinanceTransactionsPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">FINANCE</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Transactions</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Use sales, purchases, expenses, and reports for transaction-level finance data.</p>
      <div className="mt-6 flex flex-wrap gap-2"><Link href="/dashboard/sales" className="button-secondary">Sales</Link><Link href="/dashboard/purchases" className="button-secondary">Purchases</Link><Link href="/dashboard/expenses" className="button-secondary">Expenses</Link><Link href="/dashboard/reports" className="button-primary">Reports</Link></div>
    </div>
  );
}
