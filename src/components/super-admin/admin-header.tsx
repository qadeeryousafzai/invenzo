"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

export function AdminHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  return (
    <header className="flex min-h-17 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-2 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="brand-gradient grid size-9 shrink-0 place-items-center rounded-xl text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-slate-950">Invenzo <span className="font-medium text-slate-400">/ Platform</span></p>
          <p className="text-[10px] font-semibold tracking-wide text-sky-700">SUPER ADMIN</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden max-w-48 truncate px-2 text-xs text-slate-500 sm:block">{name}</span>
        <button
          aria-label="Sign out"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}