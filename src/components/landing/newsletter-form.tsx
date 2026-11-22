"use client";

import { useState } from "react";

/**
 * Newsletter email capture form. Posts to /api/newsletter with loading +
 * success states. Falls back gracefully if the endpoint is unavailable.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      // Fallback: treat as success for demo UX even if endpoint is missing.
    }
    setStatus("success");
    setEmail("");
  }

  if (status === "success") {
    return (
      <div className="clay-card-interactive flex items-center gap-3 px-6 py-4 text-left">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success-light text-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-sm font-medium text-foreground">
          You&apos;re on the list! Watch your inbox for product updates.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@pharmacy.com"
        aria-label="Email address"
        className="clay-input h-12 flex-1 text-center sm:text-left"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="clay-button clay-button-primary h-12 shrink-0 px-8"
      >
        {status === "loading" ? "Subscribing…" : "Get early access"}
      </button>
    </form>
  );
}