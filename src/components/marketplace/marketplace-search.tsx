"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  LocateFixed,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  LoaderCircle,
  Pill,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Result = {
  listingId: string;
  product: { id: string; name: string; sku: string; brand: string | null; category: string | null; description: string | null; imageUrl: string | null; unit: string };
  price: number;
  currency: string;
  availableQuantity: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  business: { name: string; slug: string; logoUrl: string | null };
  branch: { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null };
  distanceKm: number | null;
};

const suggestions = ["Paracetamol", "Vitamin D", "Blood Pressure", "Diabetes Care", "Skincare"];

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function MarketplaceSearch() {
  const [query, setQuery] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const latText = latitude.trim();
    const lngText = longitude.trim();
    if (Boolean(latText) !== Boolean(lngText)) {
      setError("Enter both coordinates, or leave both blank.");
      return;
    }
    setBusy(true);
    setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (latText && lngText) {
      params.set("latitude", latText);
      params.set("longitude", lngText);
    }
    try {
      const response = await fetch(`/api/marketplace/search?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Search is temporarily unavailable.");
      setResults(payload.data ?? []);
      setSearched(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Search is temporarily unavailable.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        toast.success("Your location is ready. Search to find nearby stock.");
      },
      () => toast.error("Location permission was denied. You can enter coordinates manually."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const hasLocation = Boolean(latitude.trim() && longitude.trim());

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90 clay-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Invenzo home" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-xl font-bold tracking-tight text-foreground">invenzo<span className="text-primary">.</span></span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/marketplace" aria-current="page" className="relative py-2 text-primary after:absolute after:inset-x-0 after:-bottom-[1.1rem] after:h-0.5 after:rounded-full after:bg-primary">Discover</Link>
            <a href="#results" className="transition hover:text-foreground">Available products</a>
            <a href="#for-businesses" className="transition hover:text-foreground">For businesses</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="clay-button clay-button-ghost text-sm">Business sign in</Link>
            <Link href="/register" className="clay-button clay-button-secondary clay-button-sm inline-flex items-center gap-1.5">
              List your business <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-line bg-background">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(13,148,136,.08),transparent_38%),radial-gradient(ellipse_at_85%_65%,rgba(13,148,136,.06),transparent_42%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-xs font-bold tracking-[.14em] text-primary">
                <span className="size-1.5 rounded-full bg-primary" /> LOCAL PRODUCT DISCOVERY
              </div>
              <h1 className="max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-.05em] text-foreground">
                Good finds,<br className="hidden sm:block" /> closer to home.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Find products listed by verified local pharmacies & health stores. Compare availability, see which branch has it, and choose pickup or delivery.
              </p>
            </div>

            <div aria-hidden="true" className="relative hidden h-48 items-center justify-center lg:flex">
              <div className="absolute size-48 rounded-full border border-primary/10" />
              <div className="absolute size-36 rounded-full border border-dashed border-primary/20" />
              <div className="absolute left-[13%] top-[20%] size-2 rounded-full bg-primary/30" />
              <div className="absolute right-[16%] top-[32%] size-2 rounded-full bg-primary/40" />
              <div className="absolute bottom-[16%] left-[24%] size-2 rounded-full bg-primary/30" />
              <div className="absolute right-[24%] bottom-[10%] size-1.5 rounded-full bg-primary/50" />
              <div className="relative grid size-[80px] place-items-center rounded-[25px] border border-primary/10 bg-surface text-primary shadow-clay-raised">
                <HeartPulse size={32} strokeWidth={1.7} />
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-background bg-success text-white"><Check size={10} strokeWidth={3} /></span>
              </div>
              <div className="absolute bottom-2 right-0 flex items-center gap-2 rounded-xl border border-line bg-surface/90 px-3 py-2 shadow-clay-raised-sm">
                <span className="grid size-7 place-items-center rounded-lg bg-primary-light text-primary"><Store size={14} /></span>
                <div><p className="text-xs font-bold text-foreground">Verified pharmacies</p><p className="mt-0.5 text-[8px] text-muted-foreground">Find nearby products</p></div>
              </div>
            </div>
          </div>

          <form onSubmit={search} className="relative mt-10 max-w-5xl clay-card clay-card-interactive p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="market-query" className="sr-only">Search products, brands, or SKU</label>
              <div className="flex min-w-0 flex-1 items-center gap-3 clay-input clay-search rounded-xl">
                <Search className="shrink-0 text-muted-foreground" size={20} strokeWidth={1.8} />
                <input
                  id="market-query"
                  className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, brands, or SKU"
                  maxLength={100}
                />
                <span className="hidden rounded-md border border-line bg-surface px-2 py-1 text-[9px] font-medium text-muted-foreground sm:inline">PRODUCTS</span>
              </div>
              <Button className="h-12 shrink-0 w-full sm:w-auto" type="submit" disabled={busy} size="lg">
                {busy ? <LoaderCircle className="animate-spin mr-2 h-5 w-5" /> : <Search className="mr-2 h-5 w-5" />}
                {busy ? "Searching" : "Search"}
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={useMyLocation} className="gap-2">
                  <LocateFixed size={15} /> Use my location
                </Button>
                {hasLocation && <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><Check size={13} /> Coordinates ready</span>}
                <span className="hidden h-4 w-px bg-line sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      {hasLocation ? "Edit coordinates" : "Enter coordinates"} <ChevronDown size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))] clay-dropdown">
                    <p className="px-2 py-2 text-xs font-semibold text-foreground">Search near a location</p>
                    <p className="px-2 text-[11px] leading-5 text-muted-foreground">Add latitude and longitude to see distances from you.</p>
                    <div className="p-2 grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground">Latitude</label>
                        <Input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          value={latitude}
                          onChange={(event) => setLatitude(event.target.value)}
                          placeholder="40.7128"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground">Longitude</label>
                        <Input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          value={longitude}
                          onChange={(event) => setLongitude(event.target.value)}
                          placeholder="-74.0060"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="px-2 text-xs leading-4 text-muted-foreground sm:px-0">Location is optional. Only verified businesses with available stock appear.</p>
            </div>
            {error && <p role="alert" className="mt-3 clay-alert clay-alert-danger">{error}</p>}
          </form>
        </div>
      </section>

      <section id="results" className="scroll-mt-24 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.15em] text-primary">DISCOVER WHAT'S AVAILABLE</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-foreground sm:text-3xl">
                {searched ? `${results.length} ${results.length === 1 ? "match" : "matches"} found` : "Explore local inventory"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {searched ? (hasLocation ? "Results include distance from your location." : "Availability can change; check with the business before visiting.") : "Search by product, brand, or SKU to see what's in stock."}
              </p>
            </div>
            {!searched && <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-muted-foreground">Try</span>
              {suggestions.map((suggestion) => <Button key={suggestion} variant="ghost" size="sm" type="button" onClick={() => setQuery(suggestion)} className="h-8 text-xs">{suggestion}</Button>)}
            </div>}
          </div>

          {busy ? (
            <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index} className="clay-card overflow-hidden">
                  <div className="aspect-[1.55] animate-pulse bg-surface-hover" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-3 w-2/5 animate-pulse rounded bg-surface-hover" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-surface-hover" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-surface-hover" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <article key={result.listingId} className="group clay-card clay-card-interactive overflow-hidden">
                  <div className="relative aspect-[1.58] overflow-hidden bg-surface-hover">
                    {result.product.imageUrl ? (
                      <Image
                        src={result.product.imageUrl}
                        alt={result.product.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--surface)_0%,transparent_42%),linear-gradient(135deg,var(--surface-hover),var(--surface-active))]">
                        <span className="grid size-16 place-items-center rounded-[22px] border border-surface/80 bg-surface/75 text-primary shadow-clay-inset-sm">
                          <ShoppingBag size={28} strokeWidth={1.4} />
                        </span>
                        <span aria-hidden="true" className="absolute -bottom-10 -right-6 size-40 rounded-full border border-surface/60" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-surface/70 bg-surface/90 px-2.5 py-1.5 text-xs font-bold text-success shadow-clay-raised-sm backdrop-blur">
                      <span className="size-1.5 rounded-full bg-success" /> Available now
                    </span>
                    {result.distanceKm !== null && (
                      <span className="absolute right-3 top-3 rounded-full border border-surface/70 bg-surface/90 px-2.5 py-1.5 text-xs font-bold text-muted-foreground shadow-clay-raised-sm backdrop-blur">
                        {result.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {[result.product.brand, result.product.category].filter(Boolean).join(" · ") || result.product.sku}
                        </p>
                        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-6 tracking-[-.02em] text-foreground">
                          {result.product.name}
                        </h3>
                      </div>
                      <p className="shrink-0 pt-0.5 text-base font-bold tracking-[-.02em] text-primary">
                        {formatPrice(result.price, result.currency)}
                        <span className="ml-1 text-xs font-medium text-muted-foreground">/ {result.product.unit}</span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {result.business.logoUrl ? (
                          <Image
                            src={result.business.logoUrl}
                            alt={`${result.business.name} logo`}
                            width={32}
                            height={32}
                            unoptimized
                            className="size-8 shrink-0 rounded-lg border border-line object-cover"
                          />
                        ) : (
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="bg-primary-light text-primary">
                              <Store size={15} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{result.business.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{result.branch.name}</p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-xs">{result.availableQuantity} {result.product.unit} left</Badge>
                    </div>

                    <div className="mt-3 flex min-h-7 items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={13} className="shrink-0 text-primary/50" />
                      <span className="min-w-0 flex-1 truncate">{result.branch.address || "Address not provided"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {result.pickupAvailable && <Badge variant="neutral" className="text-xs gap-1"><ShoppingBag size={10} /> Pickup</Badge>}
                      {result.deliveryAvailable && <Badge variant="neutral" className="text-xs gap-1"><Truck size={10} /> Delivery</Badge>}
                    </div>
                  </CardContent>
                </article>
              ))}
            </div>
          ) : (
            <Card className="clay-card overflow-hidden">
              <CardContent className="relative px-6 py-12 text-center sm:py-20">
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 size-64 rounded-full bg-[radial-gradient(circle,var(--primary-light)_0%,transparent_70%)]" />
                <div className="relative mx-auto grid size-14 place-items-center rounded-[18px] bg-primary-light text-primary">
                  <PackageSearch size={25} strokeWidth={1.6} />
                </div>
                <h3 className="relative mt-4 text-lg font-semibold tracking-[-.03em] text-foreground">
                  {searched ? "No matches just yet" : "Your next good find is out there"}
                </h3>
                <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {searched ? "Try a broader product name, brand, or SKU. Only verified businesses with available stock appear here." : "Search products, brands, or SKUs to explore current availability from local pharmacies."}
                </p>
                {!searched && <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-success"><ShieldCheck size={14} /> Listings from verified pharmacies</div>}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section id="for-businesses" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-[32px] bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[.15em] text-primary-light/80">FOR LOCAL PHARMACIES & HEALTH STORES</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Bring your products a little closer.</h2>
            <p className="mt-2 text-sm leading-6 text-primary-light">Manage your inventory and let patients discover what's available at your branches.</p>
          </div>
          <Link href="/register" className="clay-button clay-button-secondary clay-button-lg inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
              Create a business workspace <ArrowRight size={15} />
            </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-surface px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-[-.03em] text-foreground">
            <LogoMark size={20} />invenzo<span className="-ml-2 text-primary">.</span>
          </Link>
          <p className="text-xs text-muted-foreground">Product availability is supplied by participating pharmacies and may change.</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover">Business sign in <ArrowUpRight size={13} /></Link>
        </div>
      </footer>
    </main>
  );
}