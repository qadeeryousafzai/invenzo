import Link from "next/link";
import { Pill, ShieldCheck, Users, TrendingUp, BarChart3, Truck, HeartPulse, ArrowRight, CheckCircle2, Star, Zap, Globe2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Invenzo — Smart Pharmacy Inventory & POS",
  description: "Complete pharmacy management platform with inventory tracking, point of sale, multi-branch support, and local product discovery for patients.",
};

const features = [
  {
    icon: Pill,
    title: "Smart Inventory",
    description: "Real-time stock tracking across branches with batch management, expiry alerts, and automated reorder points.",
    color: "bg-primary-light text-primary",
  },
  {
    icon: HeartPulse,
    title: "Patient-First POS",
    description: "Fast, intuitive point of sale with prescription handling, insurance billing, and loyalty rewards.",
    color: "bg-success-light text-success",
  },
  {
    icon: Users,
    title: "Multi-Branch Management",
    description: "Manage multiple pharmacy locations from one dashboard with role-based access control.",
    color: "bg-info-light text-info",
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description: "Revenue trends, profit margins, top-selling products, and actionable insights for growth.",
    color: "bg-warning-light text-warning",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Ready",
    description: "Built-in regulatory compliance for controlled substances, audit trails, and data retention.",
    color: "bg-danger-light text-danger",
  },
  {
    icon: Globe2,
    title: "Local Discovery",
    description: "Patients find your products instantly with real-time availability and pickup/delivery options.",
    color: "bg-primary-light text-primary",
  },
];

const stats = [
  { value: "500+", label: "Pharmacies onboarded" },
  { value: "50K+", label: "Products listed" },
  { value: "1M+", label: "Monthly transactions" },
  { value: "99.9%", label: "Uptime guarantee" },
];

const testimonials = [
  {
    quote: "Invenzo transformed how we manage inventory across our 5 branches. Expiry waste dropped 40% in the first quarter.",
    author: "Dr. Sarah Chen",
    role: "Owner, HealthFirst Pharmacy Chain",
    avatar: "SC",
  },
  {
    quote: "The POS is incredibly fast. My staff learned it in 15 minutes. Patients love the prescription refill reminders.",
    author: "Mike Rodriguez",
    role: "Manager, Community Care Pharmacy",
    avatar: "MR",
  },
  {
    quote: "Local discovery brought 30% new walk-in customers. They search, see we have stock, and walk right in.",
    author: "Priya Sharma",
    role: "Owner, Wellness Corner",
    avatar: "PS",
  },
];

function DashboardPreviewCard({ icon: Icon, title, value, change, iconBg }: { 
  icon: React.ElementType; 
  title: string; 
  value: string; 
  change: string; 
  iconBg: string;
}) {
  return (
    <Card className="clay-card clay-card-interactive overflow-hidden" padding="lg">
      <div className="mb-4 flex items-center gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${iconBg}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <div className="h-24 bg-gradient-to-r from-primary-light/50 to-transparent rounded-xl" />
      <p className="mt-3 text-sm text-success font-medium">{change}</p>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-background to-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(13,148,136,.06),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(13,148,136,.04),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" /> New: AI Business Copilot in Beta
            </div>
            
            <div className="mb-8 flex items-center justify-center gap-3">
              <LogoMark size={36} />
              <span className="text-3xl font-bold tracking-tight text-foreground">invenzo<span className="text-primary">.</span></span>
            </div>

            <h1 className="mb-6 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.1] tracking-[-.03em] text-foreground">
              The operating system for <span className="text-primary">modern pharmacies</span>
            </h1>
            
            <p className="mb-10 mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              Complete pharmacy management: inventory, POS, multi-branch, analytics, and patient discovery.
              Built for compliance, designed for speed.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register" className="clay-button clay-button-primary clay-button-lg w-full sm:w-auto gap-2 px-8 inline-flex items-center justify-center">
                Start free trial <ArrowRight size={18} />
              </Link>
              <Link href="/marketplace" className="clay-button clay-button-secondary clay-button-lg w-full sm:w-auto gap-2 px-8 inline-flex items-center justify-center">
                Explore marketplace <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> HIPAA Compliant</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> No setup fees</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning" /> 14-day free trial</div>
              <div className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-info" /> Cancel anytime</div>
            </div>
          </div>

          {/* Dashboard Preview Cards */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-3xl" />
            </div>
            <div className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-3">
              <DashboardPreviewCard 
                icon={Pill} 
                title="Total Medicines" 
                value="2,847" 
                change="+12% vs last month" 
                iconBg="bg-primary-light text-primary" 
              />
              <DashboardPreviewCard 
                icon={HeartPulse} 
                title="Today's Sales" 
                value="PKR 1.2M" 
                change="+8% vs yesterday" 
                iconBg="bg-success-light text-success" 
              />
              <DashboardPreviewCard 
                icon={Users} 
                title="Active Patients" 
                value="15,632" 
                change="+23% vs last month" 
                iconBg="bg-info-light text-info" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-line bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-xs font-bold tracking-[.15em] text-primary">WHY INVENZO</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
              Everything you need to run a modern pharmacy
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From single-store to enterprise chains. One platform, zero compromise.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="clay-card clay-card-interactive" padding="lg">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl transition-transform hover:scale-110">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-line bg-surface py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-xs font-bold tracking-[.15em] text-primary">TRUSTED BY PHARMACIES</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
              Loved by pharmacy owners nationwide
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="clay-card" padding="lg">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="mb-6 text-base leading-7 text-foreground">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary font-semibold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-success/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-10 size-[400px] rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-10 size-[300px] rounded-full bg-success/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-[-.03em] text-foreground">
            Ready to transform your pharmacy?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join 500+ pharmacies already using Invenzo. Free 14-day trial, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="clay-button clay-button-primary clay-button-lg w-full sm:w-auto gap-2 px-8 inline-flex items-center justify-center">
              Start free trial <ArrowRight size={18} />
            </Link>
            <Link href="/marketplace" className="clay-button clay-button-secondary clay-button-lg w-full sm:w-auto gap-2 px-8 inline-flex items-center justify-center">
              Browse marketplace <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            By continuing, you agree to our <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_repeat(3,auto)]">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                <LogoMark size={24} />invenzo<span className="-ml-2 text-primary">.</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The operating system for modern pharmacies. Inventory, POS, analytics, and patient discovery in one platform.
              </p>
              <div className="mt-6 flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter"><Globe2 className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn"><Users className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub"><BarChart3 className="h-5 w-5" /></a>
              </div>
            </div>
            
            <nav>
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
                <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </nav>
            
            <nav>
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </nav>
            
            <nav>
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-primary transition-colors">Security</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </nav>
          </div>
          
          <div className="mt-12 pt-8 border-t border-line flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Invenzo. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Built with care for pharmacies everywhere.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}