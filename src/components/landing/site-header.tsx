"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Why Invenzo", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#reviews" },
  { label: "Newsletter", href: "#newsletter" },
];

/**
 * Sticky landing navbar. Hides on scroll-down, reveals on scroll-up,
 * and switches to a compact elevated style once the user scrolls.
 */
export function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        if (open) {
          setHidden(false);
        } else if (y > lastY && y > 120) {
          setHidden(true);
        } else {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  return (
    <header
      className={cn(
        "site-nav fixed inset-x-0 top-0 z-50",
        hidden ? "nav-hidden" : ""
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl transition-all duration-300",
          scrolled
            ? "mt-2 rounded-2xl border border-line bg-surface/80 px-4 shadow-[0_8px_30px_rgba(60,96,253,0.12)] backdrop-blur-xl sm:px-6"
            : "border-b border-transparent bg-transparent px-4 sm:px-6"
        )}
      >
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          >
            <Image
              src="/logo/logo.png"
              alt="Invenzo"
              width={150}
              height={150}
              className="rounded-lg"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="clay-button clay-button-ghost clay-button-sm"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="clay-button clay-button-primary clay-button-sm gap-1.5"
            >
              Start free trial
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-foreground md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden border-b border-line bg-surface/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="clay-button clay-button-secondary"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="clay-button clay-button-primary"
            >
              Start free
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}