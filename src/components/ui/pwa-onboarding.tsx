"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, ShoppingBag, ShieldCheck, Users, ArrowRight, ChevronLeft } from "lucide-react";
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
    color: "text-teal-300",
    tint: "bg-teal-400/15",
  },
  {
    title: "Track stock in real time",
    body: "Add products, log sales and purchases, and watch inventory levels update instantly.",
    icon: ShoppingBag,
    color: "text-emerald-300",
    tint: "bg-emerald-400/15",
  },
  {
    title: "Manage branches & team",
    body: "Switch locations, assign roles, and keep every workspace member in sync.",
    icon: Users,
    color: "text-cyan-300",
    tint: "bg-cyan-400/15",
  },
  {
    title: "Built to work offline",
    body: "Installed on your home screen, it opens fast and keeps working without a signal.",
    icon: ShieldCheck,
    color: "text-green-300",
    tint: "bg-green-400/15",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!visible || !mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col onboarding-fade-in"
      style={{ touchAction: "none" }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488] via-[#0f766e] to-[#134e4a]" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Decorative floating orbs */}
      <div className="absolute top-10 right-10 size-32 rounded-full bg-teal-400/10 blur-2xl onboarding-float" style={{ animationDelay: "0s" }} />
      <div className="absolute bottom-20 left-10 size-24 rounded-full bg-emerald-400/10 blur-2xl onboarding-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 left-1/4 size-16 rounded-full bg-cyan-400/10 blur-xl onboarding-float" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 sm:px-6 onboarding-slide-up">
          <button
            onClick={dismiss}
            className="rounded-full px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 transition text-xs font-semibold tracking-wider uppercase opacity-80"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === index ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30",
                )}
              />
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((slide, i) => {
              const Icon = slide.icon;
              return (
                <section
                  key={i}
                  className="flex flex-col items-center justify-center w-full shrink-0 px-6 sm:px-10 pb-10 sm:pb-0"
                >
                  <div className="relative onboarding-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    {/* Pulse ring */}
                    <div className={cn(
                      "absolute inset-0 rounded-3xl onboarding-pulse-ring",
                      slide.tint,
                    )} />
                    {/* Icon container */}
                    <div className={cn(
                      "relative flex items-center justify-center size-24 rounded-3xl mb-8 backdrop-blur-sm border border-white/10",
                      slide.tint,
                    )}>
                      <Icon size={36} className={slide.color} />
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center onboarding-slide-up" style={{ animationDelay: `${i * 0.05 + 0.1}s` }}>
                    {slide.title}
                  </h2>
                  <p className="mt-4 text-center text-sm sm:text-base text-white/85 leading-relaxed px-2 sm:px-8 max-w-sm onboarding-slide-up" style={{ animationDelay: `${i * 0.05 + 0.2}s` }}>
                    {slide.body}
                  </p>
                </section>
              );
            })}
          </div>

          {isLast ? (
            <footer className="mt-auto px-6 sm:px-10 pb-8 sm:pb-10 onboarding-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
                <button
                  onClick={dismiss}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  Maybe later
                </button>
                <button
                  onClick={dismiss}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0f766e] shadow-lg hover:bg-white/90 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get started <ArrowRight size={16} />
                </button>
              </div>
              <p className="mt-4 text-xs text-white/60 text-center">
                Installed on your home screen &mdash; open anytime, even offline.
              </p>
            </footer>
          ) : (
            <footer className="mt-auto px-6 sm:px-10 pb-8 sm:pb-10 flex justify-between items-center onboarding-slide-up" style={{ animationDelay: "0.3s" }}>
              <button
                onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                disabled={index === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 disabled:opacity-30 disabled:pointer-events-none transition hover:bg-white/20"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                onClick={() => setIndex((prev) => Math.min(SLIDES.length - 1, prev + 1))}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0f766e] shadow-lg hover:bg-white/90 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Next <ArrowRight size={16} />
              </button>
            </footer>
          )}
        </main>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#134e4a]/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}