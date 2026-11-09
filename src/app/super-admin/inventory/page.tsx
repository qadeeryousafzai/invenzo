import Link from "next/link";

export default function SuperAdminInventoryPage() {
  const items = [
    { href: "/super-admin/inventory/medicines", label: "Medicines", icon: "Pill" },
    { href: "/super-admin/inventory/categories", label: "Categories", icon: "Box" },
    { href: "/super-admin/inventory/brands", label: "Brands", icon: "Tags" },
    { href: "/super-admin/inventory/units", label: "Units", icon: "Package" },
    { href: "/super-admin/inventory/batches", label: "Batches", icon: "Building" },
    { href: "/super-admin/inventory/stock-levels", label: "Stock Levels", icon: "ShieldAlert" },
    { href: "/super-admin/inventory/expiry-management", label: "Expiry Management", icon: "AlertCircle" },
    { href: "/super-admin/inventory/stock-adjustments", label: "Stock Adjustments", icon: "RefreshCcw" },
    { href: "/super-admin/inventory/stock-transfers", label: "Stock Transfers", icon: "Truck" },
    { href: "/super-admin/inventory/barcode", label: "Barcode Management", icon: "Barcode" },
  ];

  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">INVENTORY MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Inventory</h1>
        <p className="mt-2 text-sm text-slate-500">Manage medicines, stock levels, batches, and inventory operations across all businesses.</p>
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