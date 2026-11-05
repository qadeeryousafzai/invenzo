"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    let result;
    try {
      result = await signIn("credentials", { email: values.get("email"), password: values.get("password"), redirect: false });
    } catch {
      setBusy(false);
      const message = "Sign-in is temporarily unavailable. The authentication service may need database configuration.";
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(false);
    if (!result) {
      const message = "Sign-in is temporarily unavailable. Please try again later.";
      setError(message); toast.error(message);
    } else if (result.error === "CredentialsSignin") {
      const message = "Email or password is incorrect, or the email has not been verified.";
      setError(message); toast.error(message);
    } else if (result.error) {
      const message = "Sign-in is temporarily unavailable. The authentication service may need database configuration.";
      setError(message); toast.error(message);
    }
    else {
      toast.success("Signed in successfully");
      const callbackUrl = search.get("callbackUrl");
      router.push(callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="field-label">Work email<input className="input-control" name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
      <label className="field-label">Password<input className="input-control" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /></label>
      {error && <p role="alert" className="alert-error">{error}</p>}
      <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">Forgot password?</Link></div>
      <button className="button-primary w-full" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : <>Sign in <ArrowRight size={17} /></>}</button>
      <p className="text-center text-sm text-slate-500">New to Invenzo? <Link href="/register" className="font-semibold text-emerald-800 hover:text-emerald-950">Create a workspace</Link></p>
    </form>
  );
}
