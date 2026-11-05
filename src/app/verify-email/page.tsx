import { Suspense } from "react";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { EmailActionForm } from "@/components/auth/email-action-form";

export default function VerifyEmailPage() {
  return <main className="grid min-h-screen place-items-center px-5 py-12"><div className="surface-card w-full max-w-md p-7 sm:p-9"><Link href="/" className="mb-9 inline-flex items-center gap-2 text-lg font-bold text-slate-950"><Boxes className="text-emerald-800" size={22} /> invenzo<span className="-ml-2 text-emerald-700">.</span></Link><Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}><EmailActionForm mode="verify" /></Suspense></div></main>;
}
