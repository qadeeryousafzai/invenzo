import Link from "next/link";
import { Boxes, LockKeyhole } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950"><span className="grid size-9 place-items-center rounded-xl bg-[#175b45] text-white"><Boxes size={19} /></span>invenzo<span className="-ml-2 text-emerald-700">.</span></Link><div className="surface-card p-6 sm:p-10"><div className="mb-8"><p className="text-xs font-bold tracking-[.16em] text-emerald-800">GET STARTED</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Set up your business workspace</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Create your owner account and first branch. We’ll send an email verification link before sign-in is enabled.</p></div><RegisterForm /><div className="mt-7 flex items-start gap-2.5 rounded-xl bg-[#f3f6f3] p-4 text-xs leading-5 text-slate-600"><LockKeyhole className="mt-0.5 shrink-0 text-emerald-800" size={16} /><span>Your workspace is private. Every request checks your verified membership and assigned role on the server.</span></div></div></div></main>;
}
