import Link from "next/link";
import Image from "next/image";
import {
  Pill,
  ShieldCheck,
  Users,
  TrendingUp,
  BarChart3,
  Truck,
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Globe2,
  Sparkles,
  Boxes,
  LineChart,
  BellRing,
  Stethoscope,
  CreditCard,
  Layers,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { Reveal } from "@/components/landing/reveal";
import { NewsletterForm } from "@/components/landing/newsletter-form";
import { HeroSearch } from "@/components/landing/hero-search";

export const metadata = {
  title: "Invenzo — Smart Pharmacy Inventory & POS",
  description:
    "Complete pharmacy management platform with inventory tracking, point of sale, multi-branch support, and local product discovery for patients.",
};

/* ---------- data ---------- */

const features = [
  {
    icon: Boxes,
    title: "Smart Inventory",
    description:
      "Real-time stock tracking across branches with batch management, expiry alerts, and automated reorder points.",
    color: "bg-primary-light text-primary",
  },
  {
    icon: HeartPulse,
    title: "Patient-First POS",
    description:
      "Fast, intuitive point of sale with prescription handling, insurance billing, and loyalty rewards.",
    color: "bg-success-light text-success",
  },
  {
    icon: Users,
    title: "Multi-Branch",
    description:
      "Manage multiple pharmacy locations from one dashboard with role-based access control.",
    color: "bg-info-light text-info",
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description:
      "Revenue trends, profit margins, top-selling products, and actionable insights for growth.",
    color: "bg-warning-light text-warning",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Ready",
    description:
      "Built-in regulatory compliance for controlled substances, audit trails, and data retention.",
    color: "bg-danger-light text-danger",
  },
  {
    icon: Globe2,
    title: "Local Discovery",
    description:
      "Patients find your products instantly with real-time availability and pickup/delivery options.",
    color: "bg-primary-light text-primary",
  },
];

const stats = [
  { value: "500+", label: "Pharmacies onboarded" },
  { value: "50K+", label: "Products listed" },
  { value: "1M+", label: "Monthly transactions" },
  { value: "99.9%", label: "Uptime guarantee" },
];

const steps = [
  {
    icon: Stethoscope,
    title: "1. Sign up in minutes",
    description:
      "Create your workspace, add your branches, and import your product catalog with a single CSV.",
  },
  {
    icon: Pill,
    title: "2. Go live at the counter",
    description:
      "Start ringing up sales on the fast POS, manage prescriptions, and track stock in real time.",
  },
  {
    icon: LineChart,
    title: "3. Grow with insights",
    description:
      "Watch revenue, expiry waste, and bestsellers update live — then act on recommendations.",
  },
];

const includedFeatures = [
  "24/7 support",
  "Regular version updates",
  "Guided setup",
  "Software guide",
];

const plans = [
  {
    name: "Monthly",
    price: "2,499",
    period: "/month",
    description: "Flexible monthly billing for your pharmacy.",
    cta: "Start free trial",
    href: "/register?plan=monthly",
    highlight: false,
  },
  {
    name: "Yearly",
    price: "19,999",
    period: "/year",
    description: "Best value — save with annual billing.",
    cta: "Start free trial",
    href: "/register?plan=yearly",
    highlight: true,
    badge: "Best value",
  },
  {
    name: "Lifetime",
    price: "49,999",
    period: "one-time",
    description: "Pay once. Yours for life.",
    cta: "Get lifetime",
    href: "/register?plan=lifetime",
    highlight: false,
  },
];

const testimonials = [
  {
    quote:
      "Invenzo transformed how we manage inventory across our 5 branches. Expiry waste dropped 40% in the first quarter.",
    author: "Dr. Sarah Chen",
    role: "Owner, HealthFirst Pharmacy Chain",
    avatar: "SC",
    stat: "−40% expiry waste",
  },
  {
    quote:
      "The POS is incredibly fast. My staff learned it in 15 minutes. Patients love the prescription refill reminders.",
    author: "Mike Rodriguez",
    role: "Manager, Community Care Pharmacy",
    avatar: "MR",
    stat: "15 min to learn",
  },
  {
    quote:
      "Local discovery brought 30% new walk-in customers. They search, see we have stock, and walk right in.",
    author: "Priya Sharma",
    role: "Owner, Wellness Corner",
    avatar: "PS",
    stat: "+30% new customers",
  },
];

const trustedLogos = [
  "HealthFirst",
  "Community Care",
  "Wellness Corner",
  "MedPlus",
  "CareRx",
  "GreenCross",
];

/* ---------- small building blocks ---------- */

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* ===== Hero ===== */}
      <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
        <div aria-hidden="true" className="landing-grain absolute inset-0" />
        <div
          aria-hidden="true"
          className="landing-glow absolute -left-24 top-10 size-72 bg-primary/25"
        />
        <div
          aria-hidden="true"
          className="landing-glow absolute -right-20 top-40 size-80 bg-info/20"
          style={{ animationDelay: "-4s" }}
        />
        <div
          aria-hidden="true"
          className="orb float-slow absolute left-[8%] top-40 hidden size-16 rounded-2xl bg-success/15 blur-2xl lg:block"
        />
        <div
          aria-hidden="true"
          className="orb float-slower absolute right-[10%] top-56 hidden size-20 rounded-full bg-warning/15 blur-2xl lg:block"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-5 text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.05] tracking-[-.03em] text-foreground">
              Find the medicine you need,{" "}
              <span className="relative inline-block">
                <span className="text-gradient">in stock near you</span>
                <span
                  aria-hidden="true"
                  className="hero-underline absolute inset-x-0 -bottom-1 block"
                />
              </span>
            </h1>

            <p className="mx-auto mb-9 max-w-2xl text-lg leading-8 text-muted-foreground">
              Search any medicine and instantly see which verified pharmacies
              have it in stock — with live availability, price, and pickup or
              delivery options.
            </p>

            <HeroSearch />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-success" /> Verified
                pharmacies
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> Live stock
                availability
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-warning" /> No sign-up to search
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-info" /> Instant results
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Trusted marquee ===== */}
      <section className="border-y border-line bg-surface/60 py-6">
        <div className="mx-auto mb-4 max-w-7xl px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-6 lg:px-8">
          Trusted by 500+ pharmacies
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
          <div className="landing-marquee gap-12 py-2">
            {[...trustedLogos, ...trustedLogos].map((logo, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-lg font-bold tracking-tight text-muted-foreground/60"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section id="about" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="clay-card space-y-2 p-5">
                    <BellRing className="h-6 w-6 text-warning" />
                    <p className="text-sm font-semibold text-foreground">
                      Expiry Alerts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Get notified before stock expires.
                    </p>
                  </div>
                  <div className="clay-card mt-8 space-y-2 p-5">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Instant Billing
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Checkout in under 10 seconds.
                    </p>
                  </div>
                  <div className="clay-card -mt-4 space-y-2 p-5">
                    <Layers className="h-6 w-6 text-info" />
                    <p className="text-sm font-semibold text-foreground">
                      Batch Tracking
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Trace every batch end to end.
                    </p>
                  </div>
                  <div className="clay-card space-y-2 p-5">
                    <Truck className="h-6 w-6 text-success" />
                    <p className="text-sm font-semibold text-foreground">
                      Delivery Ready
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fulfil pickup and delivery orders.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <SectionHeading
                align="left"
                eyebrow="About Invenzo"
                title={
                  <>
                    Built for the people who keep
                    communities healthy
                  </>
                }
                description="Invenzo replaces the tangle of spreadsheets, legacy tills, and disconnected tools with one calm, unified workspace — so your team can focus on patients, not paperwork."
              />
              <ul className="mt-8 space-y-4">
                {[
                  "One dashboard for every branch, product, and sale",
                  "Real-time sync across devices — online or offline",
                  "Automated compliance, audit trails, and reporting",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="clay-button clay-button-primary clay-button-lg mt-8 gap-2"
              >
                Get started <ArrowRight size={18} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Why Us ===== */}
      <section id="why" className="border-y border-line bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Why Invenzo"
              title="Everything you need to run a modern pharmacy"
              description="From single-store to enterprise chains. One platform, zero compromise."
            />
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 80}>
                <div className="clay-card-interactive group h-full p-6">
                  <div
                    className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* How it works */}
          <Reveal>
            <div className="mt-20 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="clay-card relative p-6"
                >
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="clay-card grid gap-8 p-8 text-center sm:grid-cols-4 sm:p-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-gradient">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="border-y border-line bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing"
              title="Simple pricing that scales with you"
              description="Simple, transparent pricing. No hidden fees, ever."
            />
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div
                  className={
                    plan.highlight
                      ? "relative rounded-[--radius-xl] bg-gradient-to-b from-primary/10 to-transparent p-[1.5px] shadow-[0_20px_60px_rgba(60,96,253,0.18)]"
                      : "relative"
                  }
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-md">
                      {plan.badge ?? "Most popular"}
                    </span>
                  )}
                  <div
                    className={`flex h-full flex-col p-7 ${
                      plan.highlight
                        ? "rounded-[calc(var(--radius-xl)-1.5px)] bg-surface"
                        : "clay-card"
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1">
                      {plan.name !== "Lifetime" && (
                        <span className="text-sm font-medium text-muted-foreground">
                          PKR
                        </span>
                      )}
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      {plan.name !== "Lifetime" && (
                        <span className="text-sm text-muted-foreground">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <span className="mt-6 mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Everything included:
                    </span>
                    <ul className="flex-1 space-y-3">
                      {includedFeatures.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className={
                        plan.highlight
                          ? "clay-button clay-button-primary mt-8 w-full"
                          : "clay-button clay-button-secondary mt-8 w-full"
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Reviews ===== */}
      <section id="reviews" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Reviews"
              title="Loved by pharmacy owners nationwide"
              description="Real results from real pharmacies using Invenzo every day."
            />
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.author} delay={i * 100}>
                <div className="clay-card flex h-full flex-col p-7">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className="h-5 w-5 fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 text-base leading-7 text-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t.stat}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-light font-semibold text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {t.author}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <section id="newsletter" className="relative isolate overflow-hidden py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="landing-glow absolute left-1/2 top-0 size-72 -translate-x-1/2 bg-primary/20"
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <div className="clay-card overflow-hidden p-10 sm:p-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Product updates, not spam
              </div>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
                Stay ahead of the curve
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join our newsletter for new features, pharmacy tips, and early
                access to what we&apos;re building next.
              </p>
              <div className="mt-8 flex justify-center">
                <NewsletterForm />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Unsubscribe anytime. We respect your inbox.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative isolate overflow-hidden border-t border-line bg-gradient-to-br from-primary/5 via-background to-success/5 py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="landing-glow absolute -right-10 bottom-0 size-72 bg-success/20"
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
              Ready to transform your pharmacy?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join 500+ pharmacies already using Invenzo. Free 14-day trial, no
              credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="clay-button clay-button-primary clay-button-lg w-full gap-2 px-8 sm:w-auto"
              >
                Start free trial <ArrowRight size={18} />
              </Link>
              <Link
                href="/marketplace"
                className="clay-button clay-button-secondary clay-button-lg w-full gap-2 px-8 sm:w-auto"
              >
                Browse marketplace <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-line bg-surface py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div className="max-w-xs">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
              >
                <Image
                  src="/logo/logo.png"
                  alt="Invenzo"
                  width={132}
                  height={132}
                  className="rounded-lg"
                />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The operating system for modern pharmacies. Inventory, POS,
                analytics, and patient discovery in one platform.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  { icon: Globe2, label: "Website" },
                  { icon: Users, label: "Community" },
                  { icon: BarChart3, label: "Analytics" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <nav>
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {[
                  ["Marketplace", "/marketplace"],
                  ["Features", "#why"],
                  ["Pricing", "#pricing"],
                  ["Integrations", "/integrations"],
                  ["Changelog", "/changelog"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav>
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {[
                  ["About", "#about"],
                  ["Blog", "/blog"],
                  ["Careers", "/careers"],
                  ["Contact", "/contact"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav>
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {[
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                  ["Security", "/security"],
                  ["Cookie Policy", "/cookies"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-12 flex flex-col items-center gap-2 border-t border-line pt-8 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Invenzo. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with care for pharmacies everywhere.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}