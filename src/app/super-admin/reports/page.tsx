import Link from "next/link";

export default function SuperAdminReportsPage() {
  const items = [
    { href: "/super-admin/reports/sales-reports", label: "Sales Reports", icon: "TrendingUp" },
    { href: "/super-admin/reports/purchase-reports", label: "Purchase Reports", icon: "TrendingUp" },
    { href: "/super-admin/reports/inventory-reports", label: "Inventory Reports", icon: "Box" },
    { href: "/super-admin/reports/expiry-reports", label: "Expiry Reports", icon: "AlertCircle" },
    { href: "/super-admin/reports/profit-loss", label: "Profit & Loss", icon: "TrendingUp" },
    { href: "/super-admin/reports/tax-reports", label: "Tax Reports", icon: "FileText" },
    { href: "/super-admin/reports/customers-report", label: "Customers Report", icon: "Users" },
  ];

  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">REPORTS & ANALYTICS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Generate and view sales, purchase, inventory, financial, and customer reports.</p>
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