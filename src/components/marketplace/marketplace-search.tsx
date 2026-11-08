"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
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
} from "lucide-react";
import { toast } from "sonner";

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

const suggestions = ["Coffee", "Groceries", "Electronics", "Home essentials"];

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
    <main className="min-h-screen bg-[#f8f9f6] text-[#18251f]">
      <header className="sticky top-0 z-30 border-b border-[#e7eae4] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Invenzo home" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#175b45] text-white shadow-sm shadow-[#175b45]/20"><Boxes size={19} strokeWidth={1.8} /></span>
            <span className="text-[19px] font-bold tracking-[-.055em] text-[#1d2b24]">invenzo<span className="text-[#3c8965]">.</span></span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-medium text-[#738078] md:flex">
            <Link href="/marketplace" aria-current="page" className="relative py-2 text-[#245d43] after:absolute after:inset-x-0 after:-bottom-[1.1rem] after:h-0.5 after:rounded-full after:bg-[#4f8a63]">Discover</Link>
            <a href="#results" className="transition hover:text-[#245d43]">Available products</a>
            <a href="#for-businesses" className="transition hover:text-[#245d43]">For businesses</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="inline-flex rounded-full px-2 py-2 text-[11px] font-semibold text-[#48564d] transition hover:text-[#175b45] sm:px-3 sm:text-[13px]"><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Business sign in</span></Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e3da] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#315c40] transition hover:border-[#b6ceb9] hover:bg-[#f8fbf7] sm:px-4 sm:text-xs">
              List your business <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[#e8ece5] bg-[#edf3ec]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(255,255,255,.85),transparent_38%),radial-gradient(ellipse_at_85%_65%,rgba(211,228,211,.8),transparent_42%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-5 hidden size-[32rem] rounded-full border border-[#7c9e7e]/10 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 top-24 hidden size-[19rem] rounded-full border border-[#7c9e7e]/10 lg:block" />

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-8 sm:pb-12 sm:pt-16 lg:px-10 lg:pb-14 lg:pt-[4.25rem]">
          <div className="grid items-center gap-7 lg:grid-cols-[1fr_310px] lg:gap-10">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d3e1d3] bg-white/70 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-[#52755a]">
                <span className="size-1.5 rounded-full bg-[#6fa279]" /> LOCAL PRODUCT DISCOVERY
              </div>
              <h1 className="max-w-2xl text-[clamp(2.7rem,6.6vw,5.1rem)] font-semibold leading-[.99] tracking-[-.075em] text-[#1d3025]">
                Good finds,<br className="hidden sm:block" /> closer to home.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#68776d] sm:text-base sm:leading-8">
                Find products listed by verified local businesses. Compare availability, see which branch has it, and choose pickup or delivery.
              </p>
            </div>

            <div aria-hidden="true" className="relative hidden h-48 items-center justify-center lg:flex">
              <div className="absolute size-48 rounded-full border border-[#a5bba5]/30" />
              <div className="absolute size-36 rounded-full border border-dashed border-[#9eb59f]/45" />
              <div className="absolute left-[13%] top-[20%] size-2 rounded-full bg-[#a9c4aa]" />
              <div className="absolute right-[16%] top-[32%] size-2 rounded-full bg-[#aac2aa]" />
              <div className="absolute bottom-[16%] left-[24%] size-2 rounded-full bg-[#a9c4aa]" />
              <div className="absolute right-[24%] bottom-[10%] size-1.5 rounded-full bg-[#77977d]" />
              <div className="relative grid size-[74px] place-items-center rounded-[25px] border border-white/80 bg-white text-[#326746] shadow-[0_18px_40px_-18px_rgba(37,82,52,.35)]">
                <MapPin size={29} strokeWidth={1.7} />
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-[#edf3ec] bg-[#4a8a5e] text-white"><Check size={10} strokeWidth={3} /></span>
              </div>
              <div className="absolute bottom-2 right-0 flex items-center gap-2 rounded-xl border border-[#e3e9e1] bg-white/90 px-3 py-2 shadow-sm">
                <span className="grid size-7 place-items-center rounded-lg bg-[#eaf2e9] text-[#4d7d57]"><Store size={14} /></span>
                <div><p className="text-[9px] font-bold text-[#405548]">Local businesses</p><p className="mt-0.5 text-[8px] text-[#89968c]">Find nearby products</p></div>
              </div>
            </div>
          </div>

          <form onSubmit={search} className="relative mt-8 max-w-5xl rounded-[1.35rem] border border-[#e3e8e0] bg-white p-3 shadow-[0_22px_55px_-32px_rgba(30,67,43,.28)] sm:mt-10 sm:rounded-[1.5rem] sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="market-query" className="sr-only">Search products, brands, or SKU</label>
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#e9ece6] bg-[#fcfdfa] px-3.5 focus-within:border-[#a8c3ac] focus-within:ring-4 focus-within:ring-[#77a581]/10 sm:px-4">
                <Search className="shrink-0 text-[#719078]" size={19} strokeWidth={1.8} />
                <input
                  id="market-query"
                  className="h-[52px] min-w-0 flex-1 bg-transparent text-sm text-[#293b30] outline-none placeholder:text-[#9ba69d] sm:text-[15px]"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, brands, or SKU"
                  maxLength={100}
                />
                <span className="hidden rounded-md border border-[#e6eae4] bg-white px-2 py-1 text-[9px] font-medium text-[#a0aaa1] sm:inline">PRODUCTS</span>
              </div>
              <button className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#175b45] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#124d3b] disabled:cursor-wait disabled:opacity-75 sm:min-w-40" type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={17} />}
                {busy ? "Searching" : "Search"}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-[#eef0eb] pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-1">
              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#53645a] transition hover:bg-[#f4f7f2]" type="button" onClick={useMyLocation}>
                  <LocateFixed size={15} /> Use my location
                </button>
                {hasLocation && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4d7955]"><Check size={13} /> Coordinates ready</span>}
                <span className="hidden h-4 w-px bg-[#e5e9e2] sm:block" />
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#78857b] transition hover:bg-[#f4f7f2] hover:text-[#365b40] [&::-webkit-details-marker]:hidden">
                    {hasLocation ? "Edit coordinates" : "Enter coordinates"} <ChevronDown size={13} className="transition group-open:rotate-180" />
                  </summary>
                  <div className="absolute left-0 top-[calc(100%+.5rem)] z-20 w-[min(20rem,calc(100vw-3rem))] rounded-2xl border border-[#e3e8e0] bg-white p-4 shadow-[0_18px_45px_-22px_rgba(29,55,37,.28)] sm:left-auto sm:right-0">
                    <p className="text-xs font-semibold text-[#35483b]">Search near a location</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#879289]">Add latitude and longitude to see distances from you.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <label className="text-[10px] font-semibold text-[#66746a]">Latitude<input className="mt-1.5 w-full rounded-lg border border-[#e4e9e2] bg-[#fcfdfa] px-2.5 py-2 text-xs text-[#33443a] outline-none focus:border-[#8fb197] focus:ring-3 focus:ring-[#77a581]/10" type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="40.7128" /></label>
                      <label className="text-[10px] font-semibold text-[#66746a]">Longitude<input className="mt-1.5 w-full rounded-lg border border-[#e4e9e2] bg-[#fcfdfa] px-2.5 py-2 text-xs text-[#33443a] outline-none focus:border-[#8fb197] focus:ring-3 focus:ring-[#77a581]/10" type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-74.0060" /></label>
                    </div>
                  </div>
                </details>
              </div>
              <p className="px-2 text-[10px] leading-4 text-[#929d94] sm:px-0">Location is optional. Only verified businesses with available stock appear.</p>
            </div>
            {error && <p role="alert" className="mt-3 rounded-xl border border-[#f0d4cf] bg-[#fff8f6] px-3.5 py-2.5 text-xs text-[#a34438]">{error}</p>}
          </form>
        </div>
      </section>

      <section id="results" className="scroll-mt-24 px-5 pb-16 pt-9 sm:px-8 sm:pb-20 sm:pt-12 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.15em] text-[#62816a]">DISCOVER WHAT’S AVAILABLE</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.055em] text-[#24362b] sm:text-[28px]">{searched ? `${results.length} ${results.length === 1 ? "match" : "matches"} found` : "Explore local inventory"}</h2>
              <p className="mt-1.5 text-xs text-[#849087]">{searched ? (hasLocation ? "Results include distance from your location." : "Availability can change; check with the business before visiting.") : "Search by product, brand, or SKU to see what’s in stock."}</p>
            </div>
            {!searched && <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] font-semibold text-[#8a958c]">Try</span>
              {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="rounded-full border border-[#e2e8e0] bg-white px-3 py-1.5 text-[10px] font-medium text-[#68776d] transition hover:border-[#b7cbb8] hover:text-[#315f40]">{suggestion}</button>)}
            </div>}
          </div>

          {busy ? (
            <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-[1.35rem] border border-[#e7eae4] bg-white"><div className="aspect-[1.55] animate-pulse bg-[#edf1eb]" /><div className="p-5"><div className="h-3 w-2/5 animate-pulse rounded bg-[#edf1eb]" /><div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-[#edf1eb]" /><div className="mt-6 h-3 w-1/2 animate-pulse rounded bg-[#edf1eb]" /></div></div>)}
            </div>
          ) : results.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <article key={result.listingId} className="group overflow-hidden rounded-[1.35rem] border border-[#e6eae3] bg-white shadow-[0_4px_16px_-13px_rgba(31,53,37,.28)] transition duration-200 hover:-translate-y-1 hover:border-[#d4e0d4] hover:shadow-[0_18px_35px_-20px_rgba(31,53,37,.25)]">
                  <div className="relative aspect-[1.58] overflow-hidden bg-[#edf2eb]">
                    {result.product.imageUrl ? <Image src={result.product.imageUrl} alt={result.product.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#f8faf6_0%,transparent_42%),linear-gradient(135deg,#eaf0e8,#e1ebe2)]"><span className="grid size-16 place-items-center rounded-[22px] border border-white/80 bg-white/75 text-[#618269] shadow-sm"><ShoppingBag size={28} strokeWidth={1.4} /></span><span aria-hidden="true" className="absolute -bottom-10 -right-6 size-40 rounded-full border border-white/60" /></div>}
                    <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1.5 text-[9px] font-bold text-[#376449] shadow-sm backdrop-blur"><span className="size-1.5 rounded-full bg-[#5b9c6a]" /> Available now</span>
                    {result.distanceKm !== null && <span className="absolute right-3.5 top-3.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1.5 text-[9px] font-bold text-[#4e5e52] shadow-sm backdrop-blur">{result.distanceKm} km away</span>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium text-[#859087]">{[result.product.brand, result.product.category].filter(Boolean).join(" · ") || result.product.sku}</p>
                        <h3 className="mt-1.5 line-clamp-2 text-[16px] font-semibold leading-6 tracking-[-.025em] text-[#2b3d31]">{result.product.name}</h3>
                      </div>
                      <p className="shrink-0 pt-0.5 text-[16px] font-bold tracking-[-.03em] text-[#2e6845]">{formatPrice(result.price, result.currency)}<span className="ml-1 text-[9px] font-medium text-[#939d94]">/ {result.product.unit}</span></p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#edf0eb] pt-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {result.business.logoUrl ? <Image src={result.business.logoUrl} alt={`${result.business.name} logo`} width={32} height={32} unoptimized className="size-8 shrink-0 rounded-[10px] border border-[#e8ece6] object-cover" /> : <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#edf3eb] text-[#5f8067]"><Store size={15} /></span>}
                        <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#445449]">{result.business.name}</p><p className="mt-0.5 truncate text-[10px] text-[#879289]">{result.branch.name}</p></div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#edf5ec] px-2.5 py-1.5 text-[9px] font-semibold text-[#3f744d]">{result.availableQuantity} {result.product.unit} left</span>
                    </div>

                    <div className="mt-3 flex min-h-7 items-center gap-2 text-[10px] text-[#828d84]">
                      <MapPin size={13} className="shrink-0 text-[#79917d]" />
                      <span className="min-w-0 flex-1 truncate">{result.branch.address || "Address not provided"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {result.pickupAvailable && <span className="rounded-md bg-[#f4f6f2] px-2 py-1 text-[9px] font-medium text-[#647168]">Pickup</span>}
                      {result.deliveryAvailable && <span className="inline-flex items-center gap-1 rounded-md bg-[#f4f6f2] px-2 py-1 text-[9px] font-medium text-[#647168]"><Truck size={11} /> Delivery</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[1.5rem] border border-dashed border-[#d9e2d7] bg-white px-5 py-12 text-center sm:py-[4.25rem]">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 size-64 rounded-full bg-[radial-gradient(circle,#edf4eb_0%,transparent_70%)]" />
              <div className="relative mx-auto grid size-14 place-items-center rounded-[18px] bg-[#edf4ec] text-[#598063]"><PackageSearch size={25} strokeWidth={1.6} /></div>
              <h3 className="relative mt-4 text-lg font-semibold tracking-[-.035em] text-[#324438]">{searched ? "No matches just yet" : "Your next good find is out there"}</h3>
              <p className="relative mx-auto mt-2 max-w-md text-xs leading-6 text-[#829087] sm:text-sm">
                {searched ? "Try a broader product name, brand, or SKU. Only verified businesses with available stock appear here." : "Search products, brands, or SKUs to explore current availability from local businesses."}
              </p>
              {!searched && <div className="relative mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#63806a]"><ShieldCheck size={14} /> Listings from verified businesses</div>}
            </div>
          )}
        </div>
      </section>

      <section id="for-businesses" className="scroll-mt-24 px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-[1.5rem] bg-[#174b39] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-9">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold tracking-[.15em] text-[#bed6c5]">FOR LOCAL BUSINESSES</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.05em] sm:text-3xl">Bring your products a little closer.</h2>
            <p className="mt-2 text-xs leading-6 text-[#d1ded4] sm:text-sm">Manage your inventory and let shoppers discover what’s available at your branches.</p>
          </div>
          <Link href="/register" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-[#22543a] transition hover:-translate-y-0.5 hover:bg-[#f3f7f1]">Create a business workspace <ArrowRight size={15} /></Link>
        </div>
      </section>

      <footer className="border-t border-[#e5e9e2] bg-white px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-[-.04em] text-[#35463a]"><span className="grid size-7 place-items-center rounded-[9px] bg-[#175b45] text-white"><Boxes size={14} /></span>invenzo<span className="-ml-2 text-[#3c8965]">.</span></Link>
          <p className="text-[10px] text-[#8b968d]">Product availability is supplied by participating businesses and may change.</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#66746a] transition hover:text-[#175b45]">Business sign in <ArrowUpRight size={13} /></Link>
        </div>
      </footer>
    </main>
  );
}
