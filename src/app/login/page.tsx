import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LoginPage() {
  await connection();
  const session = await auth();
  if (session?.user) redirect(session.user.platformRole === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-32 size-136 rounded-full border border-white/10 bg-[radial-gradient(circle,#55c9a244_0%,transparent_70%)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-xl font-bold tracking-tight">invenzo<span className="text-primary-light">.</span></span>
        </Link>
        <div className="relative max-w-lg pb-10">
          <p className="text-sm font-semibold tracking-[.16em] text-primary-light">SMARTER INVENTORY. GREATER CONTROL.</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">Your operations,<br />all in one place.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">A private business workspace with thoughtful access controls, branches, and a foundation ready for the next stage.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck size={17} className="text-primary-light" /> Workspace access protected by verified membership
          </div>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Invenzo</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-105">
          <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-foreground lg:hidden">
            <LogoMark size={22} /> invenzo<span className="text-primary">.</span>
          </Link>
          <p className="text-xs font-bold tracking-[.16em] text-primary">WELCOME BACK</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Sign in to your workspace</h2>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">Use the email address and password associated with your account.</p>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-in…</p>}>
            <SignInForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}