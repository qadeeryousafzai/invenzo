import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Boxes, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function LoginPage() {
  await connection();
  const session = await auth();
  if (session?.user) redirect(session.user.platformRole === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
  return <main className="grid min-h-screen bg-white lg:grid-cols-[.95fr_1.05fr]">
    <section className="relative hidden overflow-hidden bg-[#101c18] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-36 -top-32 size-136 rounded-full border border-white/5 bg-[radial-gradient(circle,#234338_0%,#101c18_70%)]" /><Link href="/" className="relative flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-emerald-700"><Boxes size={20} /></span><span className="text-xl font-bold tracking-tight">invenzo<span className="text-emerald-400">.</span></span></Link><div className="relative max-w-lg pb-10"><p className="text-sm font-semibold tracking-[.16em] text-emerald-300">SMARTER INVENTORY. GREATER CONTROL.</p><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">Your operations,<br />all in one place.</h1><p className="mt-5 max-w-md text-sm leading-7 text-slate-300">A private business workspace with thoughtful access controls, branches, and a foundation ready for the next stage.</p><div className="mt-8 flex items-center gap-2 text-sm text-slate-300"><ShieldCheck size={17} className="text-emerald-300" /> Workspace access protected by verified membership</div></div><p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Invenzo</p></section>
    <section className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-105"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-slate-950 lg:hidden"><Boxes className="text-emerald-800" size={21} /> invenzo<span className="text-emerald-700">.</span></Link><p className="text-xs font-bold tracking-[.16em] text-emerald-800">WELCOME BACK</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in to your workspace</h2><p className="mt-2 mb-8 text-sm text-slate-500">Use the email address and password associated with your account.</p><Suspense fallback={<p className="text-sm text-slate-500">Loading sign-in…</p>}><SignInForm /></Suspense></div></section>
  </main>;
}
