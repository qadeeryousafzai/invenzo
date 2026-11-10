import Link from "next/link";
export default function PrescriptionsPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">CUSTOMERS</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Prescriptions</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Prescription records are not yet modeled in the database. Customer records and sales workflows are available.</p>
      <div className="mt-6 flex gap-2"><Link href="/dashboard/customers" className="button-primary">Customers</Link><Link href="/dashboard/sales/pos" className="button-secondary">POS</Link></div>
    </div>
  );
}
