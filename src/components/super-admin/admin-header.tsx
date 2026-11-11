"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Fragment, useState } from "react";
import { Menu, Search, Bell, ChevronRight, ChevronDown, Settings as SettingsIcon, LogOut as LogOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  const currentPath = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const crumbs: { href: string; label: string }[] = [{ href: "/super-admin", label: "Super Admin" }];

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8eee8] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/90 min-h-[72px]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: mobile menu button */}
        <button
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8eee8] text-[#77847d] hover:bg-[#f1f7ee] hover:text-[#17231f] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand + breadcrumbs (desktop only) */}
        <div className="hidden min-w-0 items-center gap-2 text-sm text-[#77847d] lg:flex">
          <span className="h-4 w-4 text-[#003d32]"><Menu className="h-4 w-4" /></span>
          <span className="truncate font-medium text-[#17231f]">Invenzo</span>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.href}>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#cddbcb]" />
              <Link href={crumb.href} className={cn("truncate", i === crumbs.length - 1 ? "font-semibold text-[#17231f]" : "hover:text-[#77847d]")}>
                {crumb.label}
              </Link>
            </Fragment>
          ))}
        </div>

        {/* Center: search (desktop/tablet only) */}
        <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847d]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses, users..."
              className="h-10 rounded-xl border-[#e8eee8] bg-[#f1f7ee] pl-9 text-sm text-[#17231f] placeholder:text-[#77847d] focus-visible:bg-white focus-visible:ring-[#9be66b]/20"
            />
          </div>

          {/* Notifications */}
          <Link href="/super-admin/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8eee8] bg-[#ffffff] text-[#77847d] transition hover:bg-[#f1f7ee] hover:text-[#17231f]" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#003d32] px-1 text-[10px] font-bold text-white ring-2 ring-[#ffffff]">3</span>
          </Link>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-[#e8eee8] bg-[#ffffff] p-1.5 pr-2.5 transition hover:bg-[#f1f7ee]">
                <Avatar className="h-7 w-7 border border-[#e8eee8]"><AvatarFallback className="bg-[#f1fce0] text-[11px] font-bold text-[#003d32]">{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-[#17231f] sm:block">{name}</span>
                <ChevronDown className="h-4 w-4 text-[#77847d]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#e8eee8] bg-[#ffffff] p-1.5 shadow-lg">
              <DropdownMenuLabel className="px-2 py-2">
                <p className="text-sm font-semibold text-[#17231f]">{name}</p>
                <p className="mt-0.5 text-xs text-[#77847d]">Platform Administrator</p>
                <p className="mt-0.5 truncate text-xs text-[#003d32]">Invenzo Platform</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e8eee8]" />
              <DropdownMenuItem asChild><Link href="/super-admin/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[#77847d]"><SettingsIcon className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e8eee8]" />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer rounded-lg px-2 py-2 text-[#eb755e] focus:bg-[#fff0ec] focus:text-[#eb755e]"><LogOutIcon className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-[#e8eee8] px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77847d]" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search businesses, users..." className="h-10 rounded-xl border-[#e8eee8] bg-[#f1f7ee] pl-9 text-sm" />
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
