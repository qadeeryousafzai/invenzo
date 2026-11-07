"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Building2, CircleUserRound, LayoutDashboard, PackageSearch, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { WorkspaceControls } from "@/components/dashboard/workspace-controls";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";

type Workspace = { id: string; name: string; role: string };

export function WorkspaceShell({ children, businessName, businessType, activeId, workspaces, userName, roleName }: { children: ReactNode; businessName: string; businessType: string; activeId: string; workspaces: Workspace[]; userName: string; roleName: string }) {
  const currentPath = usePathname();
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: PackageSearch },
    { href: "/dashboard/branches", label: "Branches", icon: Building2 },
    { href: "/dashboard/employees", label: "Team & roles", icon: UsersRound },
    { href: "/dashboard/business", label: "Business profile", icon: Building2 },
    { href: "/dashboard/settings", label: "My profile", icon: CircleUserRound },
  ];
  return <div className="min-h-screen bg-[#f7f8f6]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-63 flex-col border-r border-slate-200 bg-white lg:flex">
      <Link href="/" className="flex h-19 items-center gap-2.5 border-b border-slate-100 px-6"><span className="grid size-9 place-items-center rounded-xl bg-[#175b45] text-white"><Boxes size={20} /></span><span className="text-xl font-bold tracking-tight text-slate-950">invenzo<span className="text-emerald-700">.</span></span></Link>
      <div className="mx-4 mt-5 rounded-xl bg-[#f5f7f5] p-3"><p className="truncate text-sm font-semibold text-slate-900">{businessName}</p><p className="mt-1 truncate text-xs text-slate-500">{businessType.replaceAll("_", " ").toLowerCase()}</p></div>
      <p className="px-6 pb-2 pt-7 text-[10px] font-bold tracking-[.16em] text-slate-400">WORKSPACE</p>
      <nav className="space-y-1 px-3">{links.map(({ href, label, icon: Icon }) => { const active = currentPath === href || (href !== "/dashboard" && currentPath.startsWith(`${href}/`)); return <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={17} />{label}</Link>; })}</nav>
      <div className="mt-7 border-t border-slate-100 px-6 pt-5"><p className="text-[10px] font-bold tracking-[.16em] text-slate-400">COMING SOON</p>{["Products & inventory", "Purchases & sales", "Finance & reports"].map((item) => <p key={item} className="mt-3 text-xs text-slate-400">{item}</p>)}</div>
      <div className="mt-auto border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl bg-[#f7f8f6] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-emerald-800">{userName.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{userName}</p><p className="truncate text-[10px] text-slate-500">{roleName}</p></div></div></div>
    </aside>
    <div className="lg:pl-63">
      <header className="sticky top-0 z-20 flex h-17 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3 lg:hidden"><span className="brand-gradient grid size-8 place-items-center rounded-lg text-white"><Boxes size={18} /></span><span className="font-bold text-slate-950">Invenzo</span></div><div className="hidden text-xs text-slate-400 lg:block">Workspace <span className="mx-1.5">/</span><span className="font-medium capitalize text-slate-600">{currentPath.split("/").at(-1)?.replaceAll("-", " ") || "Overview"}</span></div><div className="flex items-center gap-2"><PwaInstallButton /><WorkspaceControls workspaces={workspaces} activeId={activeId} userName={userName} /></div></header>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${currentPath === href ? "bg-emerald-50 text-emerald-900" : "text-slate-500"}`}><Icon size={14} />{label}</Link>)}</div>
      <main className="mx-auto max-w-360 px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      <footer className="mx-auto max-w-360 px-5 pb-7 text-xs text-slate-400 sm:px-8">Invenzo · Private workspace · Phase 1 foundation</footer>
    </div>
  </div>;
}
