import Link from "next/link";
export default function IncomePage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">FINANCE</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Income</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Dedicated income entries are not yet modeled. Sales revenue and reports are available from live data.</p>
      <div className="mt-6 flex gap-2"><Link href="/dashboard/reports" className="button-primary">Reports</Link><Link href="/dashboard/sales" className="button-secondary">Sales</Link></div>
    </div>
  );
}
