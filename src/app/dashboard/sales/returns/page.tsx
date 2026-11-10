import Link from "next/link";

export default function SalesReturnsPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">SALES</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Sales Returns</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Sales return workflows are not yet implemented as a separate ledger. POS sales, stock deductions, and sales history are active.</p>
      <div className="mt-6 flex gap-2"><Link href="/dashboard/sales" className="button-secondary">All Sales</Link><Link href="/dashboard/sales/pos" className="button-primary">Open POS</Link></div>
    </div>
  );
}
