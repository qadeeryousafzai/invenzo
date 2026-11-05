import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="surface-card w-full max-w-md p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600"><SearchX size={22} /></span><p className="mt-5 text-xs font-bold tracking-[.15em] text-emerald-800">404 · NOT FOUND</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">This page isn’t here</h1><p className="mt-2 text-sm leading-6 text-slate-500">The link may be incorrect, or the page may have moved.</p><Link className="button-primary mt-6" href="/"><ArrowLeft size={15} /> Back to Invenzo</Link></section></main>;
}
