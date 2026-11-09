import Link from "next/link";

export default function SuperAdminCustomersPage() {
  const items = [
    { href: "/super-admin/customers/all-customers", label: "All Customers", icon: "Users" },
    { href: "/super-admin/customers/customers-groups", label: "Customer Groups", icon: "UserCog" },
    { href: "/super-admin/customers/transactions", label: "Transactions", icon: "CreditCard" },
  ];

  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">CUSTOMER MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Customers</h1>
        <p className="mt-2 text-sm text-slate-500">Manage customers, customer groups, and transaction history.</p>
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