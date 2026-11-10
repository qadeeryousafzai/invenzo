import Link from "next/link";
export default function QuotationsPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">SALES</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Quotations</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Quotation drafting is not yet modeled. Use Point of Sale for completed sales with real inventory updates.</p>
      <div className="mt-6"><Link href="/dashboard/sales/pos" className="button-primary">Open POS</Link></div>
    </div>
  );
}
