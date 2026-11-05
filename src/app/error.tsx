"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route error", error); }, [error]);
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="surface-card w-full max-w-md p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle size={22} /></span><h1 className="mt-5 text-xl font-semibold text-slate-950">This page couldn’t load</h1><p className="mt-2 text-sm leading-6 text-slate-500">Try again. If the problem continues, check the server logs or your database configuration.</p>{error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}<div className="mt-6 flex justify-center gap-3"><button className="button-primary" onClick={() => reset()}><RefreshCw size={15} /> Try again</button><Link className="button-secondary" href="/">Go home</Link></div></section></main>;
}
