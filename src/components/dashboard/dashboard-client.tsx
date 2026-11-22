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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SaleRow = { id: string; reference: string; total: unknown; soldAt: Date | string; customer: { name: string } | null; branch: { name: string } };
type PurchaseRow = { id: string; reference: string; total: unknown; purchasedAt: Date | string; supplier: { name: string } | null; branch: { name: string } };
type LowStockRow = { id: string; stock: number; product: { name: string; sku: string }; branch: { name: string } };
type ExpiryRow = { id: string; quantityRemaining: unknown; expiryDate: Date | null; productListing: { product: { name: string }; branch: { name: string } } };
type TopSelling = { productListingId: string; name: string; branch: string; quantity: number; revenue: number };
type Stats = { todaySales: number; totalRevenue: number; totalMedicines: number; totalCustomers: number; lowStock: number; expiringSoon: number; todayPurchases: number; netProfit: number; revenueGrowth: number };

const PIE = ["#3C60FD", "#2D88FF", "#51B0FF", "#5118F7", "#D97706", "#059669"];
const money = (value: number, currency = "PKR") => value.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 0 });
const money2 = (value: number, currency = "PKR") => value.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (value: Date | string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function StatCard({ label, value, sub, icon: Icon, color = "primary" }: { label: string; value: string; sub: string; icon: React.ElementType; color?: "primary" | "success" | "warning" | "danger" | "info" }) {
  const colorMap = {
    primary: "bg-primary-light text-primary border-primary/20",
    success: "bg-success-light text-success border-success/20",
    warning: "bg-warning-light text-warning border-warning/20",
    danger: "bg-danger-light text-danger border-danger/20",
    info: "bg-info-light text-info border-info/20",
  };
  return (
    <Card variant="stat" className="h-full clay-stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-foreground truncate">{value}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground truncate">{sub}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="clay-chart-container">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function DataCard({ title, description, icon, action, children }: { 
  title: React.ReactNode; 
  description: string; 
  icon?: React.ReactNode; 
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {icon && <div className="flex items-center gap-2 mb-1.5">{icon}</div>}
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Client Dashboard</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Welcome, {greetingName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live overview for <span className="font-medium text-foreground">{businessName}</span> from your pharmacy records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.includes("sales.create") && (
            <Link href="/dashboard/sales/pos" className="clay-button clay-button-primary clay-button-sm inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Point of Sale
            </Link>
          )}
          {permissions.includes("products.view") && (
            <Link href="/dashboard/inventory" className="clay-button clay-button-secondary clay-button-sm inline-flex items-center gap-2">
              <Boxes className="h-4 w-4" /> All Medicines
            </Link>
          )}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={String(stats.todaySales)} sub="Completed sales today" icon={ClipboardList} color="primary" />
        <StatCard label="Total Revenue" value={money2(stats.totalRevenue, currency)} sub="Revenue this month" icon={CircleDollarSign} color="success" />
        <StatCard label="Total Medicines" value={String(stats.totalMedicines)} sub="Active medicine records" icon={Pill} color="info" />
        <StatCard label="Total Customers" value={String(stats.totalCustomers)} sub="Registered customers" icon={Users} color="primary" />
        <StatCard label="Low Stock Medicines" value={String(stats.lowStock)} sub={stats.lowStock > 0 ? "Needs replenishment" : "Stock levels healthy"} icon={Package} color={stats.lowStock > 0 ? "warning" : "success"} />
        <StatCard label="Expiring Medicines" value={String(stats.expiringSoon)} sub="Batches expiring in 30 days" icon={CalendarClock} color="warning" />
        <StatCard label="Today's Purchases" value={money2(stats.todayPurchases, currency)} sub="Purchase value today" icon={ShoppingBag} color="info" />
        <StatCard
          label="Net Profit"
          value={money2(stats.netProfit, currency)}
          sub={`${stats.revenueGrowth >= 0 ? "+" : ""}${stats.revenueGrowth.toFixed(1)}% revenue vs last month`}
          icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={stats.netProfit >= 0 ? "success" : "danger"}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.7fr_1fr]">
        <ChartCard title="Daily sales" description="Sales totals and order count for the current month.">
          <div className="h-64">
            {salesTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value, name) => name === "sales" ? money2(Number(value), currency) : value} contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow-clay-raised)" }} />
                  <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-line bg-surface-hover text-sm text-muted-foreground">No sales recorded this month yet.</div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Sales performance" description="Medicine categories in this workspace.">
          <div className="h-56">
            {categories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {categories.map((entry, index) => <Cell key={entry.name} fill={PIE[index % PIE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow-clay-raised)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-line bg-surface-hover text-sm text-muted-foreground">No category data available.</div>
            )}
          </div>
          <div className="space-y-2 mt-3">
            {categories.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[index % PIE.length] }} />{item.name}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Monthly revenue" description="Revenue trend over the last 6 months.">
          <div className="h-56">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value) => money2(Number(value), currency)} contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow-clay-raised)" }} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-line bg-surface-hover text-sm text-muted-foreground">No revenue history yet.</div>
            )}
          </div>
        </ChartCard>

        <DataCard 
          title="Top-selling medicines" 
          description="Best performers this month." 
          action={<Link href="/dashboard/reports/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover">Report <ArrowUpRight className="h-4 w-4" /></Link>}
        >
          <div className="space-y-3">
            {topSellingMedicines.length ? topSellingMedicines.map((item, index) => (
              <div key={item.productListingId} className="flex items-center justify-between rounded-xl border border-line bg-surface-hover px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-light text-xs font-bold text-primary ring-1 ring-line">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} sold{item.branch ? ` · ${item.branch}` : ""}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">{money2(item.revenue, currency)}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-hover p-8 text-center text-sm text-muted-foreground">No sales data yet this month.</div>
            )}
          </div>
        </DataCard>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataCard 
          title={<><AlertTriangle className="h-4 w-4 text-warning" /> Low-stock alerts</>} 
          description="Medicines that need replenishment." 
          action={<Link href="/dashboard/inventory" className="text-sm font-semibold text-primary hover:text-primary-hover">Inventory</Link>}
        >
          {lowStockMedicines.length ? (
            <div className="divide-y divide-line">
              {lowStockMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.product.sku} · {item.branch.name}</p>
                  </div>
                  <Badge variant={item.stock <= 0 ? "danger" : "warning"}>{item.stock} left</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No low-stock alerts.</div>
          )}
        </DataCard>

        <DataCard 
          title={<><CalendarClock className="h-4 w-4 text-success" /> Expiring medicine alerts</>} 
          description="Batches expiring in the next 30 days." 
          action={<Link href="/dashboard/inventory/expiry" className="text-sm font-semibold text-primary hover:text-primary-hover">Expiry view</Link>}
        >
          {expiringMedicines.length ? (
            <div className="divide-y divide-line">
              {expiringMedicines.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.productListing.product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.productListing.branch.name} · {Number(item.quantityRemaining)} units</p>
                  </div>
                  <Badge variant="success">{item.expiryDate ? shortDate(item.expiryDate) : "—"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No batches expiring in the next 30 days.</div>
          )}
        </DataCard>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DataCard 
          title="Recent transactions" 
          description="Latest completed sales." 
          action={<Link href="/dashboard/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover">View all <ArrowUpRight className="h-4 w-4" /></Link>}
        >
          {recentSales.length ? (
            <div className="divide-y divide-line">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{sale.reference} · {sale.customer?.name ?? "Walk-in customer"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sale.branch.name} · {shortDate(sale.soldAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{money2(Number(sale.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No recent sales.</div>
          )}
        </DataCard>

        <DataCard 
          title="Recent purchases" 
          description="Latest supplier purchases." 
          action={<Link href="/dashboard/purchases" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover">View all <ArrowUpRight className="h-4 w-4" /></Link>}
        >
          {recentPurchases.length ? (
            <div className="divide-y divide-line">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{purchase.reference} · {purchase.supplier?.name ?? "Supplier"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{purchase.branch.name} · {shortDate(purchase.purchasedAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{money2(Number(purchase.total), currency)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No recent purchases.</div>
          )}
        </DataCard>
      </section>
    </div>
  );
}