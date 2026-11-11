"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-[#e8eee8] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#f1f7ee]">
      <Printer className="h-3.5 w-3.5" /> Print
    </button>
  );
}