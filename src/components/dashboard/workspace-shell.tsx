"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Boxes, Building2, CircleUserRound, LayoutDashboard, PackageSearch, ReceiptText, ShoppingBasket, ShoppingCart, Tags, Truck, UserRound, UsersRound, ChartNoAxesCombined } from "lucide-react";
import type { ReactNode } from "react";
import { WorkspaceControls } from "@/components/dashboard/workspace-controls";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";

type Workspace = { id: string; name: string; role: string };

export function WorkspaceShell({ children, businessName, businessType, activeId, workspaces, userName, roleName, unreadNotifications = 0, permissions = [] }: { children: ReactNode; businessName: string; businessType: string; activeId: string; workspaces: Workspace[]; userName: string; roleName: string; unreadNotifications?: number; permissions?: string[] }) {
  const currentPath = usePathname();
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: PackageSearch, permission: "products.view" },
    { href: "/dashboard/categories", label: "Categories", icon: Tags, permission: "products.view" },
    { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view" },
    { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBasket, permission: "purchases.manage" },
    { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart, permission: "sales.view" },
    { href: "/dashboard/customers", label: "Customers", icon: UserRound, permission: "sales.view" },
    { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck, permission: "purchases.manage" },
    { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, permission: "finance.view" },
    { href: "/dashboard/reports", label: "Reports", icon: ChartNoAxesCombined, permission: "reports.view" },
    { href: "/dashboard/branches", label: "Branches", icon: Building2, permission: "branches.view" },
    { href: "/dashboard/employees", label: "Team & roles", icon: UsersRound, permission: "employees.view" },
    { href: "/dashboard/business", label: "Business profile", icon: Building2, permission: "business.view" },
    { href: "/dashboard/notifications", label: unreadNotifications ? `Notifications · ${unreadNotifications}` : "Notifications", icon: Bell, permission: "business.view" },
    { href: "/dashboard/settings", label: "My profile", icon: CircleUserRound, permission: "business.view" },
  ];
  const visibleLinks = links.filter((item) => !item.permission || permissions.includes(item.permission));
  return <div className="min-h-screen bg-[#f7f8f6]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-63 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
      <Link href="/" className="sticky top-0 z-10 flex h-19 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-white px-6"><span className="grid size-9 place-items-center rounded-xl bg-[#175b45] text-white"><Boxes size={20} /></span><span className="text-xl font-bold tracking-tight text-slate-950">invenzo<span className="text-emerald-700">.</span></span></Link>
      <div className="mx-4 mt-5 rounded-xl bg-[#f5f7f5] p-3"><p className="truncate text-sm font-semibold text-slate-900">{businessName}</p><p className="mt-1 truncate text-xs text-slate-500">{businessType.replaceAll("_", " ").toLowerCase()}</p></div>
      <p className="px-6 pb-2 pt-7 text-[10px] font-bold tracking-[.16em] text-slate-400">WORKSPACE</p>
      <nav className="space-y-1 px-3">{visibleLinks.map(({ href, label, icon: Icon }) => { const active = currentPath === href || (href !== "/dashboard" && currentPath.startsWith(`${href}/`)); return <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={17} />{label}</Link>; })}</nav>
      <div className="mt-auto border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl bg-[#f7f8f6] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-emerald-800">{userName.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{userName}</p><p className="truncate text-[10px] text-slate-500">{roleName}</p></div></div></div>
    </aside>
    <div className="lg:pl-63">
      <header className="sticky top-0 z-20 flex h-17 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3 lg:hidden"><span className="brand-gradient grid size-8 place-items-center rounded-lg text-white"><Boxes size={18} /></span><span className="font-bold text-slate-950">Invenzo</span></div><div className="hidden text-xs text-slate-400 lg:block">Workspace <span className="mx-1.5">/</span><span className="font-medium capitalize text-slate-600">{currentPath.split("/").at(-1)?.replaceAll("-", " ") || "Overview"}</span></div><div className="flex items-center gap-2"><PwaInstallButton /><WorkspaceControls workspaces={workspaces} activeId={activeId} userName={userName} /></div></header>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">{visibleLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${currentPath === href ? "bg-emerald-50 text-emerald-900" : "text-slate-500"}`}><Icon size={14} />{label}</Link>)}</div>
      <main className="mx-auto max-w-360 px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      <footer className="mx-auto max-w-360 px-5 pb-7 text-xs text-slate-400 sm:px-8">Invenzo · Private workspace · Phase 1 foundation</footer>
    </div>
  </div>;
}
