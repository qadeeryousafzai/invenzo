"use client";

import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";

export function AdminHeader({ name }: { name: string }) {
  return <header className="flex h-17 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><span className="brand-gradient grid size-9 place-items-center rounded-xl text-white"><ShieldCheck size={18} /></span><div><p className="text-sm font-bold text-slate-950">Invenzo <span className="font-medium text-slate-400">/ Platform</span></p><p className="text-[10px] font-semibold tracking-wide text-sky-700">SUPER ADMIN</p></div></div><div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:block">{name}</span><button aria-label="Sign out" onClick={() => void signOut({ callbackUrl: "/" })} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><LogOut size={16} /></button></div></header>;
}
