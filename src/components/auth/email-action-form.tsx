"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

type Mode = "forgot" | "reset" | "verify";

export function EmailActionForm({ mode }: { mode: Mode }) {
  const search = useSearchParams();
  const [message, setMessage] = useState(mode === "verify" && search.get("sent") === "1" ? "Check your inbox for a verification link. It expires in 30 minutes." : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError(""); setMessage("");
    const endpoint = mode === "forgot" ? "/api/auth/forgot-password" : mode === "reset" ? "/api/auth/reset-password" : "/api/auth/verify-email";
    const data = mode === "forgot" ? { email: values.get("email") } : mode === "reset" ? { token: search.get("token"), password: values.get("password") } : { token: search.get("token") };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = payload.error ?? "The request could not be completed.";
        setError(errorMessage); toast.error(errorMessage);
      } else {
        const successMessage = payload.message ?? "Done.";
        setMessage(successMessage); toast.success(successMessage);
      }
    } catch {
      const errorMessage = "The authentication service is unavailable. Please try again later.";
      setError(errorMessage); toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : "Verify your email";
  if ((mode === "reset" || mode === "verify") && !search.get("token") && !message) {
    return <p className="alert-error">This link is missing its security token. Request a new email and try again.</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mb-7 text-sm leading-6 text-slate-500">{mode === "forgot" ? "Enter your account email and we’ll send a secure reset link." : mode === "reset" ? "Choose a strong password that you have not used before." : "Use the button below to verify your Invenzo account."}</p>
      <form onSubmit={submit} className="space-y-5">
        {mode === "forgot" && <label className="field-label">Work email<input className="input-control" name="email" type="email" autoComplete="email" required /></label>}
        {mode === "reset" && <label className="field-label">New password<input className="input-control" name="password" type="password" autoComplete="new-password" minLength={12} required /><span className="field-hint">12+ characters, including uppercase, lowercase, and a number.</span></label>}
        {error && <p className="alert-error" role="alert">{error}</p>}
        {message && <p className="alert-success" role="status">{message}</p>}
        {!(mode === "verify" && search.get("sent") === "1") && <button className="button-primary w-full" disabled={busy || Boolean(message) && mode === "reset"}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Verify email"}</button>}
      </form>
      <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-emerald-800">Back to sign in</Link></p>
    </div>
  );
}
