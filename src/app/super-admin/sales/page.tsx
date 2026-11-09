import Link from "next/link";

export default function SuperAdminSalesPage() {
  const items = [
    { href: "/super-admin/sales/point-of-sale", label: "Point of Sale", icon: "Wallet" },
    { href: "/super-admin/sales/all-sales", label: "All Sales", icon: "FileText" },
    { href: "/super-admin/sales/sales-return", label: "Sales Return", icon: "RefreshCcw" },
    { href: "/super-admin/sales/invoice", label: "Invoice", icon: "FileText" },
    { href: "/super-admin/sales/quotation", label: "Quotation", icon: "FileText" },
  ];

  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">SALES MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sales</h1>
        <p className="mt-2 text-sm text-slate-500">Manage point of sale, sales orders, returns, invoices, and quotations.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="surface-card p-5 hover:bg-slate-50 transition-colors group">
            <div className="grid size-10 place-items-center rounded-xl bg-[#175b45]/10 text-[#175b45] group-hover:bg-[#175b45] group-hover:text-white transition-colors">
              <span className="text-lg font-medium">{item.label.charAt(0)}</span>
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{item.label}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}