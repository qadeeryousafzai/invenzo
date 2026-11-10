"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Package,
  Pill,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SaleRow = { id: string; reference: string; total: unknown; soldAt: Date | string; customer: { name: string } | null; branch: { name: string } };
type PurchaseRow = { id: string; reference: string; total: unknown; purchasedAt: Date | string; supplier: { name: string } | null; branch: { name: string } };
type LowStockRow = { id: string; product: { name: string; sku: string }; branch: { name: string }; batches: { quantityRemaining: unknown; expiryDate: Date | null }[] };
type ExpiryRow = { id: string; quantityRemaining: unknown; expiryDate: Date | null; productListing: { product: { name: string }; branch: { name: string } } };
type TopSellingRow = { productListingId: string; _sum: { quantity: unknown; lineTotal: unknown } | null };

const PIE = ["#111111", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#4b5563"];
const money = (value: number, currency = "USD") => value.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
const shortDate = (value: Date | string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function DashboardClient({
  businessName,
  greetingName,
  stats,
  recentSales,
  recentPurchases,
  lowStockMedicines,
  expiringMedicines,
  topSellingMedicines,
  salesChartData,
  revenueChartData,
  categoryChartData,
  permissions,
  currency = "USD",
}: {
  businessName: string;
  greetingName: string;
  stats: { label: string; value: string | number; change: string; icon: string; color: string; permission?: string }[];
  recentSales: SaleRow[];
  recentPurchases: PurchaseRow[];
  lowStockMedicines: LowStockRow[];
  expiringMedicines: ExpiryRow[];
  topSellingMedicines: TopSellingRow[];
  salesChartData: { date: string | Date; total: number | string; count: number | string }[];
  revenueChartData: { date: string | Date; revenue: number | string }[];
  categoryChartData: { category: string; count: number | string }[];
  permissions: string[];
  currency?: string;
}) {
  const salesTrend = salesChartData.map((row) => ({ name: shortDate(row.date), sales: Number(row.total), orders: Number(row.count) }));
  const revenueTrend = revenueChartData.map((row) => ({ name: shortDate(row.date), revenue: Number(row.revenue) }));
  const categories = categoryChartData.map((row) => ({ name: row.category || "Uncategorized", value: Number(row.count) }));

  const cards = [
    { icon: ClipboardList, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: CircleDollarSign, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: Pill, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: Package, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: Boxes, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: AlertTriangle, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: Users, tone: "bg-gray-100 border border-gray-200 text-black" },
    { icon: TrendingUp, tone: "bg-gray-100 border border-gray-200 text-black" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-black">PHARMACY DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Welcome back, {greetingName}</h1>
          <p className="mt-2 text-sm text-gray-600">Live operations overview for {businessName}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.includes("sales.create") && (
            <Link href="/dashboard/sales/pos" className="button-primary">
              <ShoppingBag size={16} /> Point of Sale
            </Link>
          )}
          {permissions.includes("products.view") && (
            <Link href="/dashboard/inventory" className="button-secondary inline-flex items-center gap-2">
              <Boxes size={16} /> Inventory
            </Link>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = cards[index % cards.length].icon;
          return (
            <article key={stat.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-black">{stat.value}</p>
                </div>
                <span className={`grid size-10 place-items-center rounded-xl ${cards[index % cards.length].tone}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-600">{stat.change !== "—" ? `${stat.change} vs previous period` : "Updated from live records"}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <article className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-black">Sales overview</h2>
              <p className="mt-1 text-xs text-gray-600">Daily sales totals for the current month.</p>
            </div>
          </div>
          <div className="h-72">
            {salesTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip formatter={(value) => money(Number(value), currency)} />
                  <Area type="monotone" dataKey="sales" stroke="#111111" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-600">No sales data for this month yet.</div>
            )}
          </div>
        </article>

        <article className="surface-card p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-black">Inventory by category</h2>
            <p className="mt-1 text-xs text-gray-600">Active medicine categories in this workspace.</p>
          </div>
          <div className="h-72">
            {categories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                    {categories.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE[index % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-600">No categories available.</div>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {categories.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-600"><span className="size-2.5 rounded-full" style={{ background: PIE[index % PIE.length] }} />{item.name}</span>
                <span className="font-semibold text-black">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card p-5">
          <h2 className="text-base font-semibold text-black">Revenue analytics</h2>
          <p className="mt-1 text-xs text-gray-600">Revenue trend over the last six months.</p>
          <div className="mt-4 h-64">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip formatter={(value) => money(Number(value), currency)} />
                  <Bar dataKey="revenue" fill="#111111" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-600">No revenue history yet.</div>
            )}
          </div>
        </article>

        <article className="surface-card p-5">
          <h2 className="text-base font-semibold text-black">Top-selling medicines</h2>
          <p className="mt-1 text-xs text-gray-600">Best performers for the current month.</p>
          <div className="mt-4 space-y-3">
            {topSellingMedicines.length ? topSellingMedicines.map((item, index) => (
              <div key={item.productListingId} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-white text-xs font-bold text-black">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-black">Listing {item.productListingId.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-600">{Number(item._sum?.quantity ?? 0)} units sold</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-black">{money(Number(item._sum?.lineTotal ?? 0), currency)}</p>
              </div>
            )) : <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600">No top-selling data yet.</div>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div><h2 className="text-base font-semibold text-black">Recent sales</h2><p className="mt-1 text-xs text-gray-600">Latest completed transactions.</p></div>
            <Link href="/dashboard/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-black">View all <ArrowRight size={14} /></Link>
          </div>
          {recentSales.length ? (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black">{sale.reference} · {sale.customer?.name ?? "Walk-in"}</p>
                    <p className="mt-1 text-xs text-gray-600">{sale.branch.name} · {shortDate(sale.soldAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-black">{money(Number(sale.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-gray-600">No recent sales.</div>}
        </article>

        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div><h2 className="text-base font-semibold text-black">Recent purchases</h2><p className="mt-1 text-xs text-gray-600">Latest supplier purchases.</p></div>
            <Link href="/dashboard/purchases" className="inline-flex items-center gap-1 text-sm font-semibold text-black">View all <ArrowRight size={14} /></Link>
          </div>
          {recentPurchases.length ? (
            <div className="divide-y divide-slate-100">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black">{purchase.reference} · {purchase.supplier?.name ?? "Supplier"}</p>
                    <p className="mt-1 text-xs text-gray-600">{purchase.branch.name} · {shortDate(purchase.purchasedAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-black">{money(Number(purchase.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-gray-600">No recent purchases.</div>}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div><h2 className="text-base font-semibold text-black">Low-stock medicines</h2><p className="mt-1 text-xs text-gray-600">Items that need replenishment attention.</p></div>
            <Link href="/dashboard/inventory" className="inline-flex items-center gap-1 text-sm font-semibold text-black">Inventory <ArrowRight size={14} /></Link>
          </div>
          {lowStockMedicines.length ? (
            <div className="divide-y divide-slate-100">
              {lowStockMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-black">{item.product.name}</p>
                    <p className="mt-1 text-xs text-gray-600">{item.product.sku} · {item.branch.name}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-black">{Number(item.batches[0]?.quantityRemaining ?? 0)} left</span>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-gray-600">No low-stock alerts.</div>}
        </article>

        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div><h2 className="text-base font-semibold text-black">Expiring medicines</h2><p className="mt-1 text-xs text-gray-600">Batches expiring in the next 30 days.</p></div>
            <Link href="/dashboard/inventory/expiry" className="inline-flex items-center gap-1 text-sm font-semibold text-black">Expiry view <ArrowRight size={14} /></Link>
          </div>
          {expiringMedicines.length ? (
            <div className="divide-y divide-slate-100">
              {expiringMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-black">{item.productListing.product.name}</p>
                    <p className="mt-1 text-xs text-gray-600">{item.productListing.branch.name} · {Number(item.quantityRemaining)} units</p>
                  </div>
                  <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-black">{item.expiryDate ? shortDate(item.expiryDate) : "—"}</span>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-gray-600">No expiring batches in the next 30 days.</div>}
        </article>
      </section>
    </div>
  );
}
