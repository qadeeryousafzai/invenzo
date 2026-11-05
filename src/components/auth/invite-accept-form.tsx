"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LoaderCircle, UserRoundCheck } from "lucide-react";

export function InviteAcceptForm({ authenticated }: { authenticated: boolean }) {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  async function accept() {
    if (!token) { setError("Invitation link is missing its security token."); return; }
    const form = document.querySelector<HTMLFormElement>("#invitation-account-form");
    const values = form ? new FormData(form) : null;
    if (!authenticated && form && values?.get("password") !== values?.get("confirmPassword")) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...(authenticated ? {} : { name: values?.get("name"), password: values?.get("password") }) }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(result.error ?? "Invitation could not be accepted."); return; }
    if (result.createdAccount) {
      setSuccess(true);
      const login = await signIn("credentials", { email: result.email, password: values?.get("password"), redirect: false });
      if (login && !login.error) { router.push("/dashboard"); router.refresh(); }
      else setError("Your account was created and the invitation accepted. Sign in to continue.");
      return;
    }
    router.push("/dashboard"); router.refresh();
  }
  return <div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Join a business workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">{authenticated ? "Accept this invitation using your signed-in account." : "Create your account with the email address that received this invitation."}</p>{!authenticated && !success && <><form id="invitation-account-form" className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void accept(); }}><label className="field-label">Your name<input className="input-control" name="name" minLength={2} maxLength={100} required /></label><label className="field-label">Password<input className="input-control" name="password" type="password" autoComplete="new-password" minLength={12} required /><span className="field-hint">12+ characters, including uppercase, lowercase, and a number.</span></label><label className="field-label">Confirm password<input className="input-control" name="confirmPassword" type="password" autoComplete="new-password" required /></label>{error && <p role="alert" className="alert-error">{error}</p>}<button type="submit" disabled={busy || !token} className="button-primary w-full">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <UserRoundCheck size={17} />} Create account & join</button></form><p className="mt-5 text-center text-sm text-slate-500">Already have an Invenzo account? <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite/accept?token=${token ?? ""}`)}`} className="font-semibold text-emerald-800">Sign in to accept</Link></p></>}{authenticated && <><button onClick={() => void accept()} disabled={busy || !token} className="button-primary mt-6 w-full">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <UserRoundCheck size={17} />} Accept invitation</button>{error && <p role="alert" className="alert-error mt-5">{error}</p>}</>}{success && <p role="status" className="alert-success mt-5">Invitation accepted. Signing in…</p>}</div>;
}
