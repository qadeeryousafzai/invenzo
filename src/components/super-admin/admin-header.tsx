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
import { cn } from "@/lib/utils";

export function AdminHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  const currentPath = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const crumbs: { href: string; label: string }[] = [{ href: "/super-admin", label: "Super Admin" }];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90 min-h-[72px]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: mobile menu button */}
        <button
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted-foreground hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand + breadcrumbs (desktop only) */}
        <div className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground lg:flex">
          <span className="h-4 w-4 text-primary"><Menu className="h-4 w-4" /></span>
          <span className="truncate font-medium text-foreground">Invenzo</span>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.href}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Link href={crumb.href} className={cn("truncate", i === crumbs.length - 1 ? "font-semibold text-foreground" : "hover:text-muted-foreground")}>
                {crumb.label}
              </Link>
            </Fragment>
          ))}
        </div>

        {/* Center: search (desktop/tablet only) */}
        <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses, users..."
              className="h-10 rounded-xl border-line bg-surface-hover pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:bg-surface focus-visible:ring-primary/20"
            />
          </div>

          {/* Notifications */}
          <Link href="/super-admin/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted-foreground transition hover:bg-surface-hover hover:text-foreground" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">3</span>
          </Link>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pr-2.5 transition hover:bg-surface-hover">
                <Avatar className="h-7 w-7 border border-line"><AvatarFallback className="bg-primary-light text-[11px] font-bold text-primary">{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">{name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-line bg-surface p-1.5 shadow-clay-raised">
              <DropdownMenuLabel className="px-2 py-2">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Platform Administrator</p>
                <p className="mt-0.5 truncate text-xs text-primary">Invenzo Platform</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem asChild><Link href="/super-admin/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground"><SettingsIcon className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="cursor-pointer rounded-lg px-2 py-2 text-destructive focus:bg-destructive/5 focus:text-destructive"><LogOutIcon className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-line px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search businesses, users..." className="h-10 rounded-xl border-line bg-surface-hover pl-9 text-sm" />
        </div>
      </div>
    </header>
  );
}
