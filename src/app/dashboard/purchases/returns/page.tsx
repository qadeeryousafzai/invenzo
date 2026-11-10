import Link from "next/link";
export default function PurchaseReturnsPage() {
  return (
    <div className="surface-card p-8">
      <p className="text-xs font-bold tracking-[.15em] text-black">PURCHASES</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">Purchase Returns</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Purchase return workflows are not yet implemented as a separate module. Purchases and stock movement history are active.</p>
      <div className="mt-6"><Link href="/dashboard/purchases" className="button-primary">Purchase Orders</Link></div>
    </div>
  );
}
