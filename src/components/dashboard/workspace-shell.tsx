"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Boxes, Tags, Truck, ShoppingCart, ShoppingBasket, UserRound, Building2, UsersRound,
  ChartNoAxesCombined, ReceiptText, Bell, ChevronDown, ChevronRight, Menu, X, Search, LogOut, Settings,
  ChevronLeft, ClipboardList, RotateCcw, FileText, CreditCard, Pill, AlertTriangle, BarChart3, Wallet, ClipboardCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { WorkspaceControls } from "@/components/dashboard/workspace-controls";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "next-auth/react";

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
    { href: "/dashboard/purchases/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers.manage" },
    { href: "/dashboard/purchases/returns", label: "Purchase Returns", icon: RotateCcw, permission: "purchases.manage" },
  ]},
  { label: "Customers", icon: UserRound, permission: "customers.manage", children: [
    { href: "/dashboard/customers", label: "All Customers", icon: UsersRound, permission: "customers.manage" },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: ClipboardCheck, permission: "sales.view" },
  ]},
  { label: "Finance", icon: Wallet, permission: "finance.view", children: [
    { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, permission: "expenses.manage" },
    { href: "/dashboard/finance/income", label: "Income", icon: CreditCard, permission: "finance.view" },
    { href: "/dashboard/finance/transactions", label: "Transactions", icon: BarChart3, permission: "finance.view" },
  ]},
  { label: "Reports", icon: ChartNoAxesCombined, permission: "reports.view", children: [
    { href: "/dashboard/reports/sales", label: "Sales Reports", icon: BarChart3, permission: "reports.view" },
    { href: "/dashboard/reports/inventory", label: "Inventory Reports", icon: Boxes, permission: "reports.view" },
    { href: "/dashboard/reports/profit-loss", label: "Profit & Loss", icon: Wallet, permission: "reports.view" },
    { href: "/dashboard/reports/expiry", label: "Expiry Reports", icon: AlertTriangle, permission: "reports.view" },
  ]},
  { href: "/dashboard/branches", label: "Branches", icon: Building2, permission: "branches.view" },
  { href: "/dashboard/employees", label: "Staff & Access", icon: UsersRound, permission: "employees.view" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "business.view" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "business.view" },
];

function hasPermission(permissions: string[], required?: string) {
  if (!required) return true;
  return permissions.includes(required);
}

export function WorkspaceShell({ children, businessName, businessType, activeId, workspaces, userName, roleName, unreadNotifications = 0, permissions = [] }: {
  children: ReactNode; businessName: string; businessType: string; activeId: string; workspaces: Workspace[]; userName: string; roleName: string; unreadNotifications?: number; permissions?: string[];
}) {
  const currentPath = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const visibleNav = SIDEBAR_NAV.filter((item) => hasPermission(permissions, item.permission));

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return currentPath === href;
    return currentPath.startsWith(`${href}/`) || currentPath === href;
  };
  const isGroupActive = (children?: NavItem[]) => children?.some((child) => isActive(child.href)) ?? false;
  const toggleGroup = (label: string) => setOpenGroups((prev) => { const next = new Set(prev); next.has(label) ? next.delete(label) : next.add(label); return next; });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white text-black">
        <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300", sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0", sidebarCollapsed && "w-20 lg:w-20")}>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 bg-white"><Pill className="h-5 w-5 text-black" /></div>
              {!sidebarCollapsed && <span className="text-xl font-bold text-black">Invenzo</span>}
            </Link>
            <button className={cn("lg:hidden p-1.5 rounded text-black", sidebarCollapsed && "hidden")} onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X className="h-5 w-5" /></button>
          </div>

          <div className={cn("mx-3 mt-4 rounded-lg border border-gray-200 bg-white p-3", sidebarCollapsed && "hidden")}>
            <p className="truncate text-sm font-semibold text-black">{businessName}</p>
            <p className="mt-1 truncate text-xs text-gray-600 capitalize">{businessType.replaceAll("_", " ").toLowerCase()}</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
            <ScrollArea className="h-full">
              <ul className="space-y-1" role="list">
                {visibleNav.map((item) => {
                  const active = isActive(item.href);
                  const groupActive = item.children && isGroupActive(item.children);
                  const Icon = item.icon;
                  if (item.children) {
                    const isOpen = openGroups.has(item.label);
                    return (
                      <li key={item.label}>
                        <button onClick={() => toggleGroup(item.label)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active || groupActive ? "bg-gray-100 text-black" : "text-black hover:bg-gray-50")} aria-expanded={isOpen}>
                          <Icon className={cn("h-5 w-5 shrink-0 text-black", sidebarCollapsed && "mx-auto")} />
                          {!sidebarCollapsed && (<><span className="flex-1 truncate">{item.label}</span><ChevronRight className={cn("h-4 w-4 text-black transition-transform", isOpen && "rotate-90", sidebarCollapsed && "hidden")} /></>)}
                        </button>
                        {!sidebarCollapsed && isOpen && (
                          <ul className="mt-1 ml-7 space-y-0.5" role="list">
                            {item.children.filter((c) => c.href && hasPermission(permissions, c.permission)).map((child) => (
                              <li key={child.href}>
                                <Link href={child.href!} className={cn("flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors", isActive(child.href) ? "bg-gray-100 text-black font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-black")}>
                                  <child.icon className="h-4 w-4 shrink-0 text-black" />{child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href ?? item.label}>
                      <Link href={item.href!} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-gray-100 text-black" : "text-black hover:bg-gray-50")} onClick={() => setSidebarOpen(false)}>
                        <Icon className={cn("h-5 w-5 shrink-0 text-black", sidebarCollapsed && "mx-auto")} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </nav>

          <div className="border-t border-gray-200 p-3">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={cn("flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black hover:bg-gray-50")} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5 shrink-0" /><span>Collapse</span></>}
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

        <div className={cn("lg:pl-64 transition-all duration-300 bg-white", sidebarCollapsed && "lg:pl-20")}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-lg text-black hover:bg-gray-100" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
              <div className="hidden lg:flex lg:items-center lg:gap-2 text-sm text-gray-600">
                <span>Dashboard</span><Separator orientation="vertical" className="h-4" /><span className="font-medium text-black capitalize">{currentPath.split("/").pop()?.replaceAll("-", " ") || "Overview"}</span>
              </div>
              <div className="hidden max-w-md flex-1 lg:block">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><Input type="search" placeholder="Search medicines, customers, sales..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 border-gray-300 bg-white pl-10 text-black" /></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip><TooltipTrigger asChild><Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-black hover:bg-gray-100"><Bell className="h-5 w-5" />{unreadNotifications > 0 && <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link></TooltipTrigger><TooltipContent side="bottom">Notifications</TooltipContent></Tooltip>
              <PwaInstallButton />
              <WorkspaceControls workspaces={workspaces} activeId={activeId} userName={userName} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"><Avatar className="h-8 w-8 border border-gray-200"><AvatarImage src="" alt={userName} /><AvatarFallback className="bg-gray-100 text-black font-medium">{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="hidden text-sm font-medium text-black sm:block">{userName}</span><ChevronDown className="h-4 w-4 text-gray-600" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-gray-200 bg-white text-black">
                  <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium text-black">{userName}</p><p className="text-xs text-gray-600 capitalize">{roleName.toLowerCase()}</p></div></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard/settings" className="flex w-full items-center gap-2"><Settings className="h-4 w-4" /> Profile &amp; Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="mx-auto max-w-full bg-white px-4 py-6 text-black sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
