"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Boxes, Tags, Truck, ShoppingCart, ShoppingBasket, UserRound, Building2,
  ChartNoAxesCombined, ReceiptText, Bell, ChevronDown, ChevronRight, Menu, X, Search, LogOut, Settings,
  PanelLeftClose, PanelLeftOpen, ClipboardList, RotateCcw, FileText, CreditCard, Pill, AlertTriangle,
  BarChart3, Wallet, ClipboardCheck, History, BadgeDollarSign, ArrowRightLeft, ShieldCheck, UserCircle2,
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
    { href: "/dashboard/products", label: "All Medicines", icon: Pill, permission: "products.view" },
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
  { href: "/dashboard/customers", label: "Customers", icon: UserRound, permission: "customers.manage" },
  { href: "/dashboard/prescriptions", label: "Prescriptions", icon: ClipboardCheck, permission: "sales.view" },
  { label: "Finance", icon: Wallet, permission: "finance.view", children: [
    { href: "/dashboard/finance/income", label: "Income", icon: BadgeDollarSign, permission: "finance.view" },
    { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, permission: "expenses.manage" },
    { href: "/dashboard/finance/transactions", label: "Transactions", icon: ArrowRightLeft, permission: "finance.view" },
  ]},
  { label: "Reports", icon: ChartNoAxesCombined, permission: "reports.view", children: [
    { href: "/dashboard/reports/sales", label: "Sales Reports", icon: BarChart3, permission: "reports.view" },
    { href: "/dashboard/reports/inventory", label: "Inventory Reports", icon: Boxes, permission: "reports.view" },
    { href: "/dashboard/reports/profit-loss", label: "Profit & Loss", icon: Wallet, permission: "reports.view" },
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
  const last = parts[parts.length - 1] ?? "dashboard";
  return last.replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function WorkspaceShell({ children, businessName, businessType, activeId, workspaces, userName, roleName, unreadNotifications = 0, permissions = [] }: {
  children: ReactNode; businessName: string; businessType: string; activeId: string; workspaces: Workspace[]; userName: string; roleName: string; unreadNotifications?: number; permissions?: string[];
}) {
  const currentPath = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const visibleNav = useMemo(() => SIDEBAR_NAV.filter((item) => hasPermission(permissions, item.permission)), [permissions]);
  const isActive = (href?: string) => !!href && (href === "/dashboard" ? currentPath === href : currentPath === href || currentPath.startsWith(`${href}/`));
  const groupHasActive = (children?: NavItem[]) => children?.some((child) => isActive(child.href)) ?? false;

  const toggleGroup = (label: string) => setOpenGroups((prev) => {
    const next = new Set(prev);
    next.has(label) ? next.delete(label) : next.add(label);
    return next;
  });

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e5e7eb] bg-white shadow-[2px_0_12px_rgba(15,23,42,0.03)] transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "w-[86px]" : "w-[288px]"
      )}>
        {/* Logo / Pharmacy */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#b7e532] text-[#14532d] ring-1 ring-[#d9f99d]">
              <Pill className="h-5 w-5" />
            </span>
            {!sidebarCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-tight tracking-tight text-slate-900">{businessName}</span>
                <span className="block truncate text-[11px] font-medium text-slate-500">{businessType.replaceAll("_", " ") || "Pharmacy"}</span>
              </span>
            )}
          </Link>
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-[#f8fafc] lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X className="h-5 w-5" /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Client navigation">
          <ul className="space-y-1.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const visibleChildren = item.children.filter((c) => c.href && hasPermission(permissions, c.permission));
                if (!visibleChildren.length) return null;
                const active = groupHasActive(visibleChildren);
                const open = openGroups.has(item.label) || active;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => !sidebarCollapsed && toggleGroup(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                        active ? "bg-[#f8fafc] text-slate-900" : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                      aria-expanded={open}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", active ? "bg-[#f1fce0] text-[#16a34a]" : "text-slate-500")}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {!sidebarCollapsed && <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
                      </>}
                    </button>
                    {!sidebarCollapsed && open && (
                      <ul className="mt-1 space-y-0.5 pl-3">
                        {visibleChildren.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <li key={`${item.label}-${child.href}-${child.label}`}>
                              <Link
                                href={child.href!}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2 text-[13px] font-medium transition-colors",
                                  childActive
                                    ? "border-[#16a34a] bg-[#f1fce0] text-[#14532d]"
                                    : "border-transparent text-slate-600 hover:border-[#e5e7eb] hover:bg-[#f8fafc] hover:text-slate-900"
                                )}
                              >
                                <ChildIcon className={cn("h-4 w-4 shrink-0", childActive ? "text-[#16a34a]" : "text-slate-400 group-hover:text-slate-600")} />
                                <span className="truncate">{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const active = isActive(item.href);
              return (
                <li key={item.href ?? item.label}>
                  <Link
                    href={item.href!}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-[#f1fce0] text-[#14532d] shadow-[inset_3px_0_0_#16a34a]"
                        : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", active ? "bg-white/70 text-[#16a34a]" : "text-slate-500 group-hover:text-slate-700")}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.label === "Notifications" && unreadNotifications > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16a34a] px-1.5 text-[10px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: profile, role, logout + collapse */}
        <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-3">
          {!sidebarCollapsed ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <Avatar className="h-10 w-10 border border-white shadow-sm">
                <AvatarFallback className="bg-[#b7e532] text-sm font-bold text-[#14532d]">{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                <p className="truncate text-xs font-medium text-[#16a34a]">{roleName}</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <Avatar className="h-10 w-10 border border-[#e5e7eb]" title={`${userName} · ${roleName}`}>
                <AvatarFallback className="bg-[#b7e532] text-xs font-bold text-[#14532d]">{userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className={cn("flex items-center gap-2", sidebarCollapsed && "flex-col")}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white text-sm font-medium text-slate-600 transition hover:bg-[#f8fafc] hover:text-slate-900",
                sidebarCollapsed ? "w-10" : "flex-1 px-3"
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Collapse</span></>}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700",
                sidebarCollapsed ? "w-10" : "px-3"
              )}
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

      <div className={cn("min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:pl-[86px]" : "lg:pl-[288px]")}>
        <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] text-slate-600 hover:bg-[#f8fafc] lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>

            <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-500 lg:flex">
              <Building2 className="h-4 w-4 text-[#16a34a]" />
              <span className="truncate font-medium text-slate-700">{businessName}</span>
              {crumbs.map((crumb, i) => (
                <Fragment key={crumb.href}>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <Link href={crumb.href} className={cn("truncate", i === crumbs.length - 1 ? "font-semibold text-slate-900" : "hover:text-slate-700")}>{crumb.label}</Link>
                </Fragment>
              ))}
            </div>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <div className="relative hidden w-full max-w-md md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search medicines, customers, sales..." className="h-10 rounded-xl border-[#e5e7eb] bg-[#f8fafc] pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-[#16a34a]/20" />
              </div>

              <Link href="/dashboard/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-slate-600 transition hover:bg-[#f8fafc] hover:text-slate-900" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16a34a] px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
              </Link>

              <PwaInstallButton />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-1.5 pr-2.5 transition hover:bg-[#f8fafc]">
                    <Avatar className="h-7 w-7 border border-[#e5e7eb]"><AvatarFallback className="bg-[#f1fce0] text-[11px] font-bold text-[#14532d]">{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:block">{userName}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#e5e7eb] bg-white p-1.5 shadow-lg">
                  <DropdownMenuLabel className="px-2 py-2">
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{roleName}</p>
                    <p className="mt-0.5 truncate text-xs text-[#16a34a]">{businessName}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                  <DropdownMenuItem asChild><Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-slate-700"><UserCircle2 className="h-4 w-4" /> Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard/business" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-slate-700"><Building2 className="h-4 w-4" /> Pharmacy settings</Link></DropdownMenuItem>
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
