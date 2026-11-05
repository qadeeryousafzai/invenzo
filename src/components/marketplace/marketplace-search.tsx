"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LocateFixed, MapPin, PackageSearch, Search, Truck, ShoppingBag, LoaderCircle } from "lucide-react";
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
      setError("Enter both latitude and longitude, or leave both blank.");
      return;
    }
    setBusy(true); setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (latText && lngText) { params.set("latitude", latText); params.set("longitude", lngText); }
    try {
      const response = await fetch(`/api/marketplace/search?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Search is temporarily unavailable.");
      setResults(payload.data ?? []);
      setSearched(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Search is temporarily unavailable.";
      setError(message); toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { toast.error("Location is not supported by this browser."); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        toast.success("Your location is ready. Search to find nearby stock.");
      },
      () => toast.error("Location permission was denied. Enter latitude and longitude manually."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return <main className="min-h-screen bg-[#f7f8f6]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-950"><span className="grid size-8 place-items-center rounded-lg bg-[#175b45] text-white"><PackageSearch size={17} /></span>invenzo<span className="-ml-2 text-emerald-700">.</span></Link><Link href="/login" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">Business sign in</Link></div></header>
    <section className="mx-auto max-w-5xl px-5 pb-10 pt-12 sm:px-8 sm:pt-16"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={14} /> Home</Link><p className="text-xs font-bold tracking-[.15em] text-emerald-800">LOCAL PRODUCT DISCOVERY</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Find it nearby.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Search products listed by verified Invenzo businesses and see branches with eligible stock, price, and distance.</p>
      <form onSubmit={search} className="surface-card mt-8 p-4 sm:p-5"><label htmlFor="market-query" className="field-label">What are you looking for?</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="market-query" className="input-control mt-0 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands, or SKU" maxLength={100} /><button className="button-primary shrink-0" type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={17} />} Search products</button></div><div className="mt-4 flex flex-wrap items-end gap-3"><button className="button-secondary inline-flex items-center gap-2" type="button" onClick={useMyLocation}><LocateFixed size={15} /> Use my location</button><div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-sm"><label className="field-label">Latitude<input className="input-control" type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 40.7128" /></label><label className="field-label">Longitude<input className="input-control" type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. -74.0060" /></label></div></div><p className="mt-3 text-xs text-slate-400">Location is optional. If permission is denied, enter coordinates manually. Results never include expired or zero-stock batches.</p>{error && <p role="alert" className="alert-error mt-4">{error}</p>}</form>
    </section>
    <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-900">{searched ? `${results.length} nearby result${results.length === 1 ? "" : "s"}` : "Available products"}</h2><span className="text-xs text-slate-500">Verified businesses only</span></div>{results.length ? <div className="grid gap-4 md:grid-cols-2">{results.map((result) => <article key={result.listingId} className="surface-card overflow-hidden p-5"><div className="flex gap-4"><div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f1f5f2] text-emerald-800">{result.product.imageUrl ? <Image src={result.product.imageUrl} alt={result.product.name} width={64} height={64} unoptimized className="size-full object-cover" /> : <ShoppingBag size={25} />}</div><div className="min-w-0 flex-1"><p className="truncate text-base font-semibold text-slate-950">{result.product.name}</p><p className="mt-1 truncate text-xs text-slate-500">{[result.product.brand, result.product.category].filter(Boolean).join(" · ") || result.product.sku}</p><p className="mt-3 text-xl font-bold text-emerald-900">{formatPrice(result.price, result.currency)}</p></div></div><div className="mt-4 border-t border-slate-100 pt-4"><p className="text-sm font-semibold text-slate-800">{result.business.name} · {result.branch.name}</p><p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 shrink-0" size={13} />{result.branch.address || "Address not provided"}{result.distanceKm !== null && <span className="ml-auto shrink-0 font-semibold text-slate-700">{result.distanceKm} km</span>}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">{result.availableQuantity} {result.product.unit} available</span>{result.pickupAvailable && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Pickup</span>}{result.deliveryAvailable && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600"><Truck size={12} />Delivery</span>}</div></div></article>)}</div> : <div className="surface-card px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><PackageSearch size={23} /></span><h2 className="mt-4 font-semibold text-slate-900">{searched ? "No available matches found" : "Search local business inventory"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{searched ? "Try a different product or location. Only verified businesses with non-expired stock are shown." : "Search by product, brand, or SKU. Businesses must publish a listing and record available stock."}</p></div>}</section>
    <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-400">Product availability is supplied by participating businesses and may change.</footer>
  </main>;
}
