"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Package,
  Pill,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
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
type LowStockRow = { id: string; stock: number; product: { name: string; sku: string }; branch: { name: string } };
type ExpiryRow = { id: string; quantityRemaining: unknown; expiryDate: Date | null; productListing: { product: { name: string }; branch: { name: string } } };
type TopSelling = { productListingId: string; name: string; branch: string; quantity: number; revenue: number };
type Stats = { todaySales: number; totalRevenue: number; totalMedicines: number; totalCustomers: number; lowStock: number; expiringSoon: number; todayPurchases: number; netProfit: number; revenueGrowth: number };

const PIE = ["#16a34a", "#b7e532", "#86efac", "#4ade80", "#22c55e", "#bbf7d0"];
const money = (value: number, currency = "PKR") => value.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
const money2 = (value: number, currency = "PKR") => value.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (value: Date | string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function StatCard({ label, value, sub, icon: Icon, accent = false }: { label: string; value: string; sub: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <article className="surface-card-glass-strong rounded-[14px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${accent ? "border-[#b7e532] bg-[#f7fde8] text-[#3f6212]" : "border-[#e5e7eb] bg-[#f8fafc] text-[#16a34a]"}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

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
  currency = "PKR",
}: {
  businessName: string;
  greetingName: string;
  stats: Stats;
  recentSales: SaleRow[];
  recentPurchases: PurchaseRow[];
  lowStockMedicines: LowStockRow[];
  expiringMedicines: ExpiryRow[];
  topSellingMedicines: TopSelling[];
  salesChartData: { date: Date | string; total: number | string; count: number | string }[];
  revenueChartData: { date: Date | string; revenue: number | string }[];
  categoryChartData: { category: string; count: number | string }[];
  permissions: string[];
  currency?: string;
}) {
  const salesTrend = salesChartData.map((row) => ({ name: shortDate(row.date), sales: Number(row.total), orders: Number(row.count) }));
  const revenueTrend = revenueChartData.map((row) => ({ name: shortDate(row.date), revenue: Number(row.revenue) }));
  const categories = categoryChartData.map((row) => ({ name: row.category || "Uncategorized", value: Number(row.count) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Client Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Welcome, {greetingName}</h1>
          <p className="mt-1.5 text-sm text-slate-500">Live overview for <span className="font-medium text-slate-700">{businessName}</span> from your pharmacy records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.includes("sales.create") && (
            <Link href="/dashboard/sales/pos" className="button-primary"><ShoppingCart className="h-4 w-4" /> Point of Sale</Link>
          )}
          {permissions.includes("products.view") && (
            <Link href="/dashboard/inventory" className="button-secondary"><Boxes className="h-4 w-4" /> All Medicines</Link>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={String(stats.todaySales)} sub="Completed sales today" icon={ClipboardList} accent />
        <StatCard label="Total Revenue" value={money2(stats.totalRevenue, currency)} sub="Revenue this month" icon={CircleDollarSign} />
        <StatCard label="Total Medicines" value={String(stats.totalMedicines)} sub="Active medicine records" icon={Pill} />
        <StatCard label="Total Customers" value={String(stats.totalCustomers)} sub="Registered customers" icon={Users} />
        <StatCard label="Low Stock Medicines" value={String(stats.lowStock)} sub={stats.lowStock > 0 ? "Needs replenishment" : "Stock levels healthy"} icon={Package} />
        <StatCard label="Expiring Medicines" value={String(stats.expiringSoon)} sub="Batches expiring in 30 days" icon={CalendarClock} />
        <StatCard label="Today's Purchases" value={money2(stats.todayPurchases, currency)} sub="Purchase value today" icon={ShoppingBag} />
        <StatCard
          label="Net Profit"
          value={money2(stats.netProfit, currency)}
          sub={`${stats.revenueGrowth >= 0 ? "+" : ""}${stats.revenueGrowth.toFixed(1)}% revenue vs last month`}
          icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
          accent={stats.netProfit >= 0}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <article className="surface-card-glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Daily sales</h2>
              <p className="mt-1 text-xs text-slate-500">Sales totals and order count for the current month.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-slate-600">This month</span>
          </div>
          <div className="h-72">
            {salesTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#b7e532" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value, name) => name === "sales" ? money2(Number(value), currency) : value} />
                  <Area type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8fafc] text-sm text-slate-500">No sales recorded this month yet.</div>}
          </div>
        </article>

        <article className="surface-card-glass p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Sales performance</h2>
            <p className="mt-1 text-xs text-slate-500">Medicine categories in this workspace.</p>
          </div>
          <div className="h-56">
            {categories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {categories.map((entry, index) => <Cell key={entry.name} fill={PIE[index % PIE.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8fafc] text-sm text-slate-500">No category data available.</div>}
          </div>
          <div className="space-y-2">
            {categories.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[index % PIE.length] }} />{item.name}</span>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card-glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Monthly revenue</h2>
              <p className="mt-1 text-xs text-slate-500">Revenue trend over the last 6 months.</p>
            </div>
          </div>
          <div className="h-64">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value) => money2(Number(value), currency)} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8fafc] text-sm text-slate-500">No revenue history yet.</div>}
          </div>
        </article>

        <article className="surface-card-glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-base font-semibold text-slate-900">Top-selling medicines</h2><p className="mt-1 text-xs text-slate-500">Best performers this month.</p></div>
            <Link href="/dashboard/reports/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-[#16a34a] hover:text-[#15803d]">Report <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="space-y-3">
            {topSellingMedicines.length ? topSellingMedicines.map((item, index) => (
              <div key={item.productListingId} className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-xs font-bold text-[#14532d] ring-1 ring-[#e5e7eb]">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} sold{item.branch ? ` · ${item.branch}` : ""}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900">{money2(item.revenue, currency)}</p>
              </div>
            )) : <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8fafc] p-8 text-center text-sm text-slate-500">No sales data yet this month.</div>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <div><h2 className="text-base font-semibold text-slate-900">Recent transactions</h2><p className="mt-1 text-xs text-slate-500">Latest completed sales.</p></div>
            <Link href="/dashboard/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-[#16a34a] hover:text-[#15803d]">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {recentSales.length ? (
            <div className="divide-y divide-[#e5e7eb]">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{sale.reference} · {sale.customer?.name ?? "Walk-in customer"}</p>
                    <p className="mt-1 text-xs text-slate-500">{sale.branch.name} · {shortDate(sale.soldAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{money2(Number(sale.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">No recent sales.</div>}
        </article>

        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <div><h2 className="text-base font-semibold text-slate-900">Recent purchases</h2><p className="mt-1 text-xs text-slate-500">Latest supplier purchases.</p></div>
            <Link href="/dashboard/purchases" className="inline-flex items-center gap-1 text-sm font-semibold text-[#16a34a] hover:text-[#15803d]">View all <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {recentPurchases.length ? (
            <div className="divide-y divide-[#e5e7eb]">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{purchase.reference} · {purchase.supplier?.name ?? "Supplier"}</p>
                    <p className="mt-1 text-xs text-slate-500">{purchase.branch.name} · {shortDate(purchase.purchasedAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{money2(Number(purchase.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">No recent purchases.</div>}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <div><h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low-stock alerts</h2><p className="mt-1 text-xs text-slate-500">Medicines that need replenishment.</p></div>
            <Link href="/dashboard/inventory" className="text-sm font-semibold text-[#16a34a] hover:text-[#15803d]">Inventory</Link>
          </div>
          {lowStockMedicines.length ? (
            <div className="divide-y divide-[#e5e7eb]">
              {lowStockMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.product.sku} · {item.branch.name}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.stock <= 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"}`}>{item.stock} left</span>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">No low-stock alerts.</div>}
        </article>

        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <div><h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><CalendarClock className="h-4 w-4 text-[#16a34a]" /> Expiring medicine alerts</h2><p className="mt-1 text-xs text-slate-500">Batches expiring in the next 30 days.</p></div>
            <Link href="/dashboard/inventory/expiry" className="text-sm font-semibold text-[#16a34a] hover:text-[#15803d]">Expiry view</Link>
          </div>
          {expiringMedicines.length ? (
            <div className="divide-y divide-[#e5e7eb]">
              {expiringMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.productListing.product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.productListing.branch.name} · {Number(item.quantityRemaining)} units</p>
                  </div>
                  <span className="rounded-full bg-[#f7fde8] px-2.5 py-1 text-xs font-semibold text-[#3f6212] ring-1 ring-[#d9f99d]">{item.expiryDate ? shortDate(item.expiryDate) : "—"}</span>
                </div>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">No batches expiring in the next 30 days.</div>}
        </article>
      </section>
    </div>
  );
}
