"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Boxes, Tags, Truck, ShoppingCart, ShoppingBasket, UserRound, Building2, UsersRound,
  ChartNoAxesCombined, ReceiptText, Bell, ChevronDown, ChevronRight, Menu, X, Search, LogOut, Settings,
  PanelLeftClose, PanelLeftOpen, ClipboardList, RotateCcw, FileText, CreditCard, Pill, AlertTriangle,
  BarChart3, Wallet, ClipboardCheck, History, BadgeDollarSign, ArrowRightLeft, ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { WorkspaceControls } from "@/components/dashboard/workspace-controls";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Workspace = { id: string; name: string; role: string };
type NavItem = { href?: string; label: string; icon: React.ElementType; permission?: string; children?: NavItem[] };

const SIDEBAR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "business.view" },
  { label: "Inventory", icon: Boxes, permission: "inventory.view", children: [
    { href: "/dashboard/inventory", label: "All Medicines", icon: Pill, permission: "products.view" },
    { href: "/dashboard/categories", label: "Categories", icon: Tags, permission: "categories.manage" },
    { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers.manage" },
    { href: "/dashboard/inventory/adjustments", label: "Stock Adjustments", icon: RotateCcw, permission: "inventory.adjust" },
    { href: "/dashboard/inventory/expiry", label: "Expiry Management", icon: AlertTriangle, permission: "inventory.view" },
  ]},
  { label: "Sales", icon: ShoppingCart, permission: "sales.view", children: [
    { href: "/dashboard/sales/pos", label: "Point of Sale", icon: CreditCard, permission: "sales.create" },
    { href: "/dashboard/sales", label: "All Sales", icon: ClipboardList, permission: "sales.view" },
    { href: "/dashboard/sales/returns", label: "Sales Returns", icon: RotateCcw, permission: "sales.create" },
    { href: "/dashboard/sales/invoices", label: "Invoices", icon: FileText, permission: "sales.view" },
    { href: "/dashboard/sales/quotations", label: "Quotations", icon: ClipboardCheck, permission: "sales.create" },
  ]},
  { label: "Purchases", icon: ShoppingBasket, permission: "purchases.manage", children: [
    { href: "/dashboard/purchases", label: "Purchase Orders", icon: ClipboardList, permission: "purchases.manage" },
    { href: "/dashboard/purchases", label: "Purchase History", icon: History, permission: "purchases.manage" },
    { href: "/dashboard/purchases/returns", label: "Purchase Returns", icon: RotateCcw, permission: "purchases.manage" },
  ]},
  { label: "Customers", icon: UserRound, permission: "customers.manage", children: [
    { href: "/dashboard/customers", label: "Customers", icon: UsersRound, permission: "customers.manage" },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: ClipboardCheck, permission: "sales.view" },
  ]},
  { label: "Finance", icon: Wallet, permission: "finance.view", children: [
    { href: "/dashboard/finance/income", label: "Income", icon: BadgeDollarSign, permission: "finance.view" },
    { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, permission: "expenses.manage" },
    { href: "/dashboard/finance/transactions", label: "Transactions", icon: ArrowRightLeft, permission: "finance.view" },
  ]},
  { label: "Reports", icon: ChartNoAxesCombined, permission: "reports.view", children: [
    { href: "/dashboard/reports/sales", label: "Sales Reports", icon: BarChart3, permission: "reports.view" },
    { href: "/dashboard/reports/inventory", label: "Inventory Reports", icon: Boxes, permission: "reports.view" },
    { href: "/dashboard/reports/profit-loss", label: "Profit & Loss", icon: Wallet, permission: "reports.view" },
    { href: "/dashboard/reports/expiry", label: "Expiry Reports", icon: AlertTriangle, permission: "reports.view" },
  ]},
  { href: "/dashboard/employees", label: "Staff & Permissions", icon: ShieldCheck, permission: "employees.view" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "business.view" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "business.view" },
];

function hasPermission(permissions: string[], required?: string) {
  if (!required) return true;
  return permissions.includes(required);
}

function labelForPath(path: string) {
  if (path === "/dashboard") return "Dashboard";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1]?.replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase()) ?? "Dashboard";
}

export function WorkspaceShell({ children, businessName, businessType, activeId, workspaces, userName, roleName, unreadNotifications = 0, permissions = [] }: {
  children: ReactNode; businessName: string; businessType: string; activeId: string; workspaces: Workspace[]; userName: string; roleName: string; unreadNotifications?: number; permissions?: string[];
}) {
  const currentPath = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Inventory", "Sales", "Purchases", "Customers", "Finance", "Reports"]));

  const visibleNav = useMemo(() => SIDEBAR_NAV.filter((item) => hasPermission(permissions, item.permission)), [permissions]);
  const isActive = (href?: string) => !!href && (href === "/dashboard" ? currentPath === href : currentPath === href || currentPath.startsWith(`${href}/`));
  const groupActive = (children?: NavItem[]) => children?.some((child) => isActive(child.href)) ?? false;
  const toggleGroup = (label: string) => setOpenGroups((prev) => { const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next; });

  const crumbs = useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);
    const acc: { href: string; label: string }[] = [];
    let path = "";
    for (const part of parts) {
      path += `/${part}`;
      acc.push({ href: path, label: labelForPath(path) });
    }
    return acc.length ? acc : [{ href: "/dashboard", label: "Dashboard" }];
  }, [currentPath]);

  const NavLink = ({ item, child = false }: { item: NavItem; child?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href!}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          child ? "ml-8 px-3 py-2 text-[13px]" : "",
          active
            ? "bg-[#f1fce0] text-[#14532d] shadow-[inset_3px_0_0_#16a34a]"
            : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#16a34a]" : "text-slate-500 group-hover:text-slate-700", sidebarCollapsed && !child && "mx-auto")} />
        {(!sidebarCollapsed || child) && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e5e7eb] bg-white transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "w-[84px]" : "w-[280px]"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#b7e532] text-[#14532d] shadow-sm"><Pill className="h-5 w-5" /></span>
            {!sidebarCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-tight text-slate-900">{businessName}</span>
                <span className="block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Client Panel</span>
              </span>
            )}
          </Link>
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar">
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const open = openGroups.has(item.label) || groupActive(item.children);
                const active = groupActive(item.children);
                const visibleChildren = item.children.filter((c) => c.href && hasPermission(permissions, c.permission));
                if (!visibleChildren.length) return null;
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-[#f8fafc] text-slate-900" : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#16a34a]" : "text-slate-500", sidebarCollapsed && "mx-auto")} />
                      {!sidebarCollapsed && <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
                      </>}
                    </button>
                    {!sidebarCollapsed && open && (
                      <ul className="mt-1 space-y-0.5">
                        {visibleChildren.map((child) => <li key={`${item.label}-${child.href}-${child.label}`}><NavLink item={child} child /></li>)}
                      </ul>
                    )}
                  </li>
                );
              }
              return <li key={item.href ?? item.label}><NavLink item={item} /></li>;
            })}
          </ul>
        </nav>

        <div className="border-t border-[#e5e7eb] p-3">
          {!sidebarCollapsed && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2.5">
              <Avatar className="h-9 w-9 border border-[#e5e7eb]"><AvatarFallback className="bg-white text-[#14532d] text-xs font-bold">{userName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">{roleName}</p>
              </div>
            </div>
          )}
          <div className={cn("flex items-center gap-2", sidebarCollapsed ? "flex-col" : "")}>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900", sidebarCollapsed ? "w-10 px-0" : "flex-1")}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Collapse</span></>}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700", sidebarCollapsed ? "w-10 px-0" : "")}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <div className={cn("min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[280px]")}>
        <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] text-slate-600 hover:bg-[#f8fafc] lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>

            <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-500 lg:flex">
              <span className="truncate font-medium text-slate-700">{businessName}</span>
              {crumbs.map((crumb, i) => (
                <Fragment key={crumb.href}>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                  <Link href={crumb.href} className={cn("truncate capitalize", i === crumbs.length - 1 ? "font-semibold text-slate-900" : "hover:text-slate-700")}>{crumb.label}</Link>
                </Fragment>
              ))}
            </div>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <div className="relative hidden w-full max-w-md md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search medicines, customers, sales..." className="h-10 rounded-xl border-[#e5e7eb] bg-[#f8fafc] pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:bg-white" />
              </div>

              <Link href="/dashboard/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16a34a] px-1 text-[10px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
              </Link>

              <PwaInstallButton />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-1.5 pr-2.5 hover:bg-[#f8fafc]">
                    <Avatar className="h-7 w-7 border border-[#e5e7eb]"><AvatarFallback className="bg-[#f1fce0] text-[#14532d] text-[11px] font-bold">{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:block">{userName}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl border-[#e5e7eb] bg-white p-1.5 shadow-lg">
                  <DropdownMenuLabel className="px-2 py-2">
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{roleName} · {businessName}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                  <DropdownMenuItem asChild><Link href="/dashboard/business" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-slate-700"><Building2 className="h-4 w-4" /> Pharmacy profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-slate-700"><Settings className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer rounded-lg px-2 py-2 text-red-700 focus:bg-red-50 focus:text-red-700"><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="border-t border-[#e5e7eb] px-4 py-2 md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search medicines, customers, sales..." className="h-10 rounded-xl border-[#e5e7eb] bg-[#f8fafc] pl-9 text-sm" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {workspaces.length > 1 && (
            <div className="mb-4 flex justify-end">
              <WorkspaceControls workspaces={workspaces} activeId={activeId} userName={userName} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
