"use client";

import Link from "next/link";
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
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Super Admin navigation"
      >
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-white px-4">
          <span className="grid size-8 place-items-center rounded-xl bg-[#175b45] text-white">
            <LayoutDashboard size={20} />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950 flex-1 text-left">
            Invenzo<span className="text-emerald-700">.</span>
          </span>
          <button
            className="ml-auto lg:hidden size-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-4 mt-5 rounded-xl bg-[#f5f7f5] p-3">
          <p className="truncate text-sm font-semibold text-slate-900 text-left">Super Admin</p>
          <p className="mt-1 truncate text-xs text-slate-500 text-left">Platform Operations</p>
        </div>

        <p className="px-4 pb-2 pt-7 text-[10px] font-bold tracking-[.16em] text-slate-400 text-left">MENU</p>

        <nav className="space-y-1 px-3 pb-6">
          {ROOT_MENU.map((entry) => {
            if ("items" in entry) {
              const isOpenGroup = openGroups.has(entry.label);
              const isActive = groupActive(entry);
              const Icon = entry.icon;
              return (
                <div key={entry.label} className="space-y-1">
                  <button
                    onClick={() => void toggleGroup(entry.label)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition text-left ${
                      isActive
                        ? "bg-[#eaf2ed] text-[#175b45]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    aria-expanded={isOpenGroup}
                    aria-label={entry.label}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpenGroup ? "rotate-180" : ""}`} />
                  </button>
                  {isOpenGroup && (
                    <div className="space-y-0.5 ml-7">
                      {entry.items.map((item) => {
                        const active = itemActive(item);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition text-left ${
                              active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                            onClick={handleNavClick}
                          >
                            <span className="size-1.5" />
                            {item.label}
                            {active && (
                              <span className="ml-auto size-1.5 rounded-full bg-[#175b45]" aria-label="active" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition text-left ${
                  active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                onClick={handleNavClick}
              >
                <Icon size={18} />
                {entry.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}