"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, ShoppingBag, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "invenzo:welcome:v1";

type Slide = {
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
  tint: string;
};

const SLIDES: Slide[] = [
  {
    title: "Welcome to Invenzo",
    body: "Your inventory, branches, and team — all in one place, built for mobile.",
    icon: Box,
    color: "text-[#176b87]",
    tint: "bg-[#176b87]/10",
  },
  {
    title: "Track stock in real time",
    body: "Add products, log sales and purchases, and watch inventory levels update instantly.",
    icon: ShoppingBag,
    color: "text-[#147d78]",
    tint: "bg-[#147d78]/10",
  },
  {
    title: "Manage branches & team",
    body: "Switch locations, assign roles, and keep every workspace member in sync.",
    icon: Users,
    color: "text-[#24738f]",
    tint: "bg-[#24738f]/10",
  },
  {
    title: "Built to work offline",
    body: "Installed on your home screen, it opens fast and keeps working without a signal.",
    icon: ShieldCheck,
    color: "text-[#1d5e75]",
    tint: "bg-[#1d5e75]/10",
  },
];

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function PwaOnboarding() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY) && isStandalone();
  });
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  }, []);

  const isLast = index === SLIDES.length - 1;

  useEffect(() => {
    // Mount-gate the overlay so server and first client render both output null,
    // avoiding a hydration mismatch before painting the onboarding.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!visible || !mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#176b87] to-[#147d78]" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 sm:px-6">
          <button
            onClick={dismiss}
            className="rounded-full p-2 bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="Skip onboarding"
          >
            <span className="sr-only">Skip</span>
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Skip</span>
          </button>
          <div className="flex gap-1">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-300",
                  i <= index ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
            {SLIDES.map((slide, i) => {
              const Icon = slide.icon;
              return (
              <section
                key={i}
                className="flex flex-col items-center justify-center w-full px-6 sm:px-10 pb-10 sm:pb-0"
              >
                <div className={`flex shrink-0 items-center justify-center size-20 rounded-2xl mb-6 ${slide.tint} ${slide.color}`}>
                  <Icon size={28} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{slide.title}</h2>
                <p className="mt-4 text-center text-sm sm:text-base text-white/90 leading-relaxed px-2 sm:px-8">
                  {slide.body}
                </p>
              </section>
              );
            })}
          </div>

          {isLast ? (
            <footer className="mt-auto px-6 sm:px-10 pb-8 sm:pb-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
                <button
                  onClick={dismiss}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  Maybe later
                </button>
                <button
                  onClick={dismiss}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#176b87] shadow-lg hover:bg-white/90 transition"
                >
                  Get started <ArrowRight size={16} />
                </button>
              </div>
              <p className="mt-4 text-xs text-white/70 text-center">
                Installed on your home screen &mdash; open anytime, even offline.
              </p>
            </footer>
          ) : (
            <footer className="mt-auto px-6 sm:px-10 pb-8 sm:pb-10 flex justify-between items-center">
              <button
                onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                disabled={index === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Back
              </button>
              <button
                onClick={() => setIndex((prev) => Math.min(SLIDES.length - 1, prev + 1))}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#176b87] shadow-lg hover:bg-white/90 transition"
              >
                Next <ArrowRight size={16} />
              </button>
            </footer>
          )}
        </main>

        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#147d78]/90 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
