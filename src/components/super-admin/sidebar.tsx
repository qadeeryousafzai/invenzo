"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  ClipboardCheck,
  Pause,
  Mail,
  Building2,
  ChevronDown,
  X,
  PanelLeftOpen,
  LogOut,
  Globe2,
} from "lucide-react";

type MenuItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
  exact?: boolean;
};

type MenuGroup = {
  label: string;
  href: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
};

const ROOT_MENU: (MenuItem | MenuGroup)[] = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/super-admin/create-user", label: "Create User", icon: UserPlus },
  { href: "/super-admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/super-admin/temp-disable", label: "Temp Disable Accounts", icon: Pause },
  { href: "/super-admin/messages", label: "Messages from User", icon: Mail },
  { href: "/super-admin/catalog", label: "Medicine Catalog", icon: Globe2 },
  {
    label: "Businesses",
    href: "/super-admin/businesses",
    icon: Building2,
    items: [
      { href: "/super-admin/businesses", label: "All Businesses" },
      { href: "/super-admin/verified-users", label: "Verified Users" },
      { href: "/super-admin/payment-pending", label: "Payment Pending/Suspended" },
    ],
  },
];

export function SuperAdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const currentPath = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const itemActive = (item: MenuItem) =>
    item.exact ? currentPath === item.href : currentPath.startsWith(item.href + "/") || currentPath === item.href;

  const groupActive = (group: MenuGroup) => group.items.some((item) => itemActive(item));

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#17231f]/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e8eee8] bg-[#ffffff] shadow-[2px_0_12px_rgba(0,61,50,0.03)] transition-all duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} w-[288px]`}
        role="navigation"
        aria-label="Super Admin navigation"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e8eee8] px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9be66b] text-[#003d32] ring-1 ring-[#d9f99d]">
              <LayoutDashboard size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold leading-tight tracking-tight text-[#17231f]">Invenzo</span>
              <span className="block truncate text-[11px] font-medium text-[#77847d]">SUPER ADMIN</span>
            </span>
          </div>
          <button className="rounded-lg p-1.5 text-[#77847d] hover:bg-[#f1f7ee] lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mt-5 rounded-xl bg-[#f1f7ee] p-3 border border-[#e8eee8]">
          <p className="truncate text-sm font-semibold text-[#17231f] text-left">Platform Admin</p>
          <p className="mt-1 truncate text-xs text-[#77847d] text-left">Platform Operations</p>
        </div>

        <p className="px-4 pb-2 pt-7 text-[10px] font-bold tracking-[.16em] text-[#77847d] text-left">MENU</p>

        <nav className="space-y-1 px-3 pb-6 overflow-y-auto flex-1">
          {ROOT_MENU.map((entry) => {
            if ("items" in entry) {
              const isOpenGroup = openGroups.has(entry.label);
              const isActive = groupActive(entry);
              const Icon = entry.icon;
              return (
                <div key={entry.label} className="space-y-1">
                  <button
                    onClick={() => void toggleGroup(entry.label)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${isActive ? "bg-[#f1fce0] text-[#003d32]" : "text-[#77847d] hover:bg-[#f1f7ee] hover:text-[#17231f]"}`}
                    aria-expanded={isOpenGroup}
                    aria-label={entry.label}
                  >
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", isActive ? "bg-[#f1fce0] text-[#003d32]" : "text-[#77847d]")}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 truncate">{entry.label}</span>
                    <ChevronDown className={cn("h-4 w-4 text-[#77847d] transition-transform duration-200", isOpenGroup && "rotate-180")} />
                  </button>
                  {isOpenGroup && (
                    <ul className="mt-1 space-y-0.5 pl-3">
                      {entry.items.map((item) => {
                        const active = itemActive(item);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={handleNavClick}
                              className={cn(
                                "group flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2 text-[13px] font-medium transition-colors",
                                active ? "border-[#003d32] bg-[#f1fce0] text-[#003d32]" : "border-transparent text-[#77847d] hover:border-[#e8eee8] hover:bg-[#f1f7ee] hover:text-[#17231f]"
                              )}
                            >
                              <span className="h-4 w-4 shrink-0 text-[#77847d] group-hover:text-[#17231f]" />
                              <span className="truncate">{item.label}</span>
                              {active && (
                                <span className="ml-auto size-1.5 rounded-full bg-[#003d32]" aria-label="active" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            }
            const active = itemActive(entry);
            const Icon = entry.icon ?? LayoutDashboard;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={handleNavClick}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active ? "bg-[#f1fce0] text-[#003d32] shadow-[inset_3px_0_0_#003d32]" : "text-[#77847d] hover:bg-[#f1f7ee] hover:text-[#17231f]"
                )}
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", active ? "bg-white/70 text-[#003d32]" : "text-[#77847d] group-hover:text-[#17231f]")}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate">{entry.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-[#e8eee8] bg-[#ffffff] p-3">
          <div className={cn("flex items-center gap-2")}>
            <button
              type="button"
              onClick={() => onClose()}
              className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e8eee8] bg-[#ffffff] text-sm font-medium text-[#77847d] transition hover:bg-[#f1f7ee] hover:text-[#17231f]", "flex-1 px-3")}
              aria-label="Collapse sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
              <span>Collapse</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e8eee8] bg-[#ffffff] text-sm font-medium text-[#77847d] transition hover:border-#eb755e hover:bg-#fff0ec hover:text-[#eb755e]", "px-3")}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
