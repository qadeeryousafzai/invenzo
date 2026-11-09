"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  CheckCircle,
  ClipboardCheck,
  Banknote,
  Pause,
  Mail,
  Box,
  Pill,
  Tags,
  Package,
  Building,
  ShieldAlert,
  RefreshCcw,
  Truck,
  Barcode,
  Wallet,
  FileText,
  ChevronDown,
  Users,
  User,
  CreditCard,
  PiggyBank,
  TrendingUp,
  AlertCircle,
  UserCog,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  "Create User": UserPlus,
  "Verified User": CheckCircle,
  Approvals: ClipboardCheck,
  "Payment Pending/Suspended": Banknote,
  "Temp Disable Accounts": Pause,
  "Messages from User": Mail,
  Medicines: Pill,
  Categories: Box,
  Brands: Tags,
  Units: Package,
  Batches: Building,
  "Stock Levels": ShieldAlert,
  "Expiry Management": AlertCircle,
  "Stock Adjustments": RefreshCcw,
  "Stock Transfers": Truck,
  "Barcode Management": Barcode,
  "Point of Sale": Wallet,
  "All Sales": FileText,
  "Sales Return": ChevronDown,
  Invoice: FileText,
  Quotation: FileText,
  "Purchase Orders": Truck,
  "All Purchase": TrendingUp,
  "Purchase Return": ChevronDown,
  Suppliers: User,
  "Goods Received": Box,
  "All Customers": Users,
  "Customers Groups": UserCog,
  Transactions: CreditCard,
  "All Prescriptions": FileText,
  "Prescriptions Details": FileText,
  "Prescriptions History": FileText,
  Payment: PiggyBank,
  Expenses: Wallet,
  Income: TrendingUp,
  "Cash Register": CreditCard,
  "Sales Reports": TrendingUp,
  "Purchase Reports": TrendingUp,
  "Inventory Reports": Box,
  "Expiry Reports": AlertCircle,
  "Profit & Loss": TrendingUp,
  "Tax Reports": FileText,
  "Customers Report": Users,
  Notification: Bell,
  General: User,
  "Pharmacy Profile": Building,
  Business: Building,
  Tax: FileText,
  Security: ShieldAlert,
  Appearance: PaletteIcon,
  "Help And Support": HelpCircle,
} as const;

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="9" r="7" />
      <circle cx="5" cy="5" r="3" />
      <circle cx="19" cy="5" r="3" />
      <circle cx="12" cy="15" r="3" />
    </svg>
  );
}

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
  { href: "/super-admin/verified-users", label: "Verified User", icon: CheckCircle },
  { href: "/super-admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/super-admin/payment-pending", label: "Payment Pending/Suspended", icon: Banknote },
  { href: "/super-admin/temp-disable", label: "Temp Disable Accounts", icon: Pause },
  { href: "/super-admin/messages", label: "Messages from User", icon: Mail },
  {
    label: "Inventory",
    href: "/super-admin/inventory",
    icon: Box,
    items: [
      { href: "/super-admin/inventory/medicines", label: "Medicines" },
      { href: "/super-admin/inventory/categories", label: "Categories" },
      { href: "/super-admin/inventory/brands", label: "Brands" },
      { href: "/super-admin/inventory/units", label: "Units" },
      { href: "/super-admin/inventory/batches", label: "Batches" },
      { href: "/super-admin/inventory/stock-levels", label: "Stock Levels" },
      { href: "/super-admin/inventory/expiry-management", label: "Expiry Management" },
      { href: "/super-admin/inventory/stock-adjustments", label: "Stock Adjustments" },
      { href: "/super-admin/inventory/stock-transfers", label: "Stock Transfers" },
      { href: "/super-admin/inventory/barcode", label: "Barcode Management" },
    ],
  },
  {
    label: "Sales",
    href: "/super-admin/sales",
    icon: Wallet,
    items: [
      { href: "/super-admin/sales/point-of-sale", label: "Point of Sale" },
      { href: "/super-admin/sales/all-sales", label: "All Sales" },
      { href: "/super-admin/sales/sales-return", label: "Sales Return" },
      { href: "/super-admin/sales/invoice", label: "Invoice" },
      { href: "/super-admin/sales/quotation", label: "Quotation" },
    ],
  },
  {
    label: "Purchase",
    href: "/super-admin/purchase",
    icon: Truck,
    items: [
      { href: "/super-admin/purchase/purchase-orders", label: "Purchase Orders" },
      { href: "/super-admin/purchase/all-purchase", label: "All Purchase" },
      { href: "/super-admin/purchase/purchase-return", label: "Purchase Return" },
      { href: "/super-admin/purchase/suppliers", label: "Suppliers" },
      { href: "/super-admin/purchase/goods-received", label: "Goods Received" },
    ],
  },
  {
    label: "Customers",
    href: "/super-admin/customers",
    icon: Users,
    items: [
      { href: "/super-admin/customers/all-customers", label: "All Customers" },
      { href: "/super-admin/customers/customers-groups", label: "Customers Groups" },
      { href: "/super-admin/customers/transactions", label: "Transactions" },
    ],
  },
  {
    label: "Prescriptions",
    href: "/super-admin/prescriptions",
    icon: FileText,
    items: [
      { href: "/super-admin/prescriptions/all-prescriptions", label: "All Prescriptions" },
      { href: "/super-admin/prescriptions/prescriptions-details", label: "Prescriptions Details" },
      { href: "/super-admin/prescriptions/prescriptions-history", label: "Prescriptions History" },
    ],
  },
  {
    label: "Finance",
    href: "/super-admin/finance",
    icon: PiggyBank,
    items: [
      { href: "/super-admin/finance/payment", label: "Payment" },
      { href: "/super-admin/finance/expenses", label: "Expenses" },
      { href: "/super-admin/finance/income", label: "Income" },
      { href: "/super-admin/finance/cash-register", label: "Cash Register" },
      { href: "/super-admin/finance/transactions", label: "Transactions" },
    ],
  },
  {
    label: "Reports",
    href: "/super-admin/reports",
    icon: TrendingUp,
    items: [
      { href: "/super-admin/reports/sales-reports", label: "Sales Reports" },
      { href: "/super-admin/reports/purchase-reports", label: "Purchase Reports" },
      { href: "/super-admin/reports/inventory-reports", label: "Inventory Reports" },
      { href: "/super-admin/reports/expiry-reports", label: "Expiry Reports" },
      { href: "/super-admin/reports/profit-loss", label: "Profit & Loss" },
      { href: "/super-admin/reports/tax-reports", label: "Tax Reports" },
      { href: "/super-admin/reports/customers-report", label: "Customers Report" },
    ],
  },
  { href: "/super-admin/notifications", label: "Notification", icon: Bell },
  {
    label: "Settings",
    href: "/super-admin/settings",
    icon: Settings,
    items: [
      { href: "/super-admin/settings/general", label: "General" },
      { href: "/super-admin/settings/pharmacy-profile", label: "Pharmacy Profile" },
      { href: "/super-admin/settings/business", label: "Business" },
      { href: "/super-admin/settings/tax", label: "Tax" },
      { href: "/super-admin/settings/payment", label: "Payment" },
      { href: "/super-admin/settings/invoice", label: "Invoice" },
      { href: "/super-admin/settings/notification", label: "Notification" },
      { href: "/super-admin/settings/security", label: "Security" },
      { href: "/super-admin/settings/appearance", label: "Appearance" },
    ],
  },
  { href: "/super-admin/help", label: "Help And Support", icon: HelpCircle },
];

export function SuperAdminSidebar() {
  const currentPath = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const leafIcon = (label: string) => ICONS[label] ?? LayoutDashboard;

  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-17 left-4 z-40 size-9 rounded-lg bg-white border border-slate-200 shadow-md flex items-center justify-center"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={isMobileOpen}
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Super Admin navigation"
      >
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-white px-6">
          <span className="grid size-8 place-items-center rounded-xl bg-[#175b45] text-white">
            <LayoutDashboard size={20} />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Invenzo<span className="text-emerald-700">.</span>
          </span>
          <button
            className="ml-auto lg:hidden size-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-4 mt-5 rounded-xl bg-[#f5f7f5] p-3">
          <p className="truncate text-sm font-semibold text-slate-900">Super Admin</p>
          <p className="mt-1 truncate text-xs text-slate-500">Platform Operations</p>
        </div>

        <p className="px-6 pb-2 pt-7 text-[10px] font-bold tracking-[.16em] text-slate-400">MENU</p>

        <nav className="space-y-1 px-3 pb-6">
          {ROOT_MENU.map((entry) => {
            if ("items" in entry) {
              const isOpen = openGroups.has(entry.label);
              const isActive = groupActive(entry);
              const Icon = entry.icon;
              return (
                <div key={entry.label} className="space-y-1">
                  <button
                    onClick={() => void toggleGroup(entry.label)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#eaf2ed] text-[#175b45]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    aria-expanded={isOpen}
                    aria-label={entry.label}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{entry.label}</span>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 ml-7">
                      {entry.items.map((item) => {
                        const active = itemActive(item);
                        const Icon = leafIcon(item.label);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                              active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            <Icon size={16} />
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-[#eaf2ed] text-[#175b45]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                onClick={closeMobileMenu}
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