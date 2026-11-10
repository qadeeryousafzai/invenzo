import Link from "next/link";
export default function InvoicesPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">SALES</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Invoices</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Printable receipts are generated after completing a POS sale. A dedicated invoice list/template can be added as a follow-up module.</p>
      <div className="mt-6 flex gap-2"><Link href="/dashboard/sales/pos" className="button-primary">Open POS</Link><Link href="/dashboard/sales" className="button-secondary">Sales History</Link></div>
    </div>
  );
}
