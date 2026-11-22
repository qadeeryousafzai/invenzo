"use client";

import { useState } from "react";
import {
  Search,
  LoaderCircle,
  MapPin,
  Store,
  Pill,
  PackageSearch,
  Truck,
  ShoppingBag,
  LocateFixed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
  listingId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    brand: string | null;
    category: string | null;
    unit: string;
  };
  price: number;
  currency: string;
  availableQuantity: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  business: { name: string; slug: string; logoUrl: string | null };
  branch: { id: string; name: string; address: string | null };
  distanceKm: number | null;
};

const suggestions = ["Paracetamol", "Vitamin D", "Insulin", "Amoxicillin", "Omeprazole"];

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

/**
 * Hero medicine search. Queries /api/marketplace/search and shows which
 * pharmacies currently have the medicine in stock.
 */
export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    const params = new URLSearchParams({ q: trimmed });
    if (latitude !== null && longitude !== null) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    }
    try {
      const res = await fetch(`/api/marketplace/search?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Search is temporarily unavailable.");
      setResults(payload.data ?? []);
      setSearched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search is temporarily unavailable.");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => setError("Location permission denied. Search without location instead."),
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Search bar */}
      <form
        onSubmit={onSubmit}
        className="clay-card clay-card-interactive p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-surface px-4 shadow-[inset_2px_2px_6px_rgba(60,96,253,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-light">
            <Search className="shrink-0 text-muted-foreground" size={20} strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a medicine, brand, or generic name…"
              aria-label="Search medicines"
              maxLength={100}
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="clay-button clay-button-primary h-12 shrink-0 px-8 text-base"
          >
            {busy ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            {busy ? "Searching" : "Search"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          <button
            type="button"
            onClick={useMyLocation}
            className="clay-button clay-button-ghost clay-button-sm gap-1.5 text-muted-foreground"
          >
            <LocateFixed size={14} />
            {latitude !== null ? "Location set" : "Use my location"}
          </button>
          <span className="hidden h-4 w-px bg-line sm:block" />
          {suggestions.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                void runSearch(s);
              }}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </form>

      {/* Results */}
      {busy && (
        <div className="mt-6 space-y-3" aria-live="polite">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="clay-card h-24 animate-pulse bg-surface-hover/60" />
          ))}
        </div>
      )}

      {!busy && searched && (
        <div className="mt-8 text-left" aria-live="polite">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-foreground">
              {results.length > 0
                ? `${results.length} ${results.length === 1 ? "pharmacy has" : "pharmacies have"} this in stock`
                : "No pharmacies found"}
            </h3>
            <span className="text-xs text-muted-foreground">
              {latitude !== null ? "Sorted by distance" : "Available now"}
            </span>
          </div>

          {results.length > 0 ? (
            <ul className="space-y-3">
              {results.slice(0, 4).map((r) => (
                <li
                  key={r.listingId}
                  className="clay-card flex items-center gap-4 p-4"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {r.product.name}
                      </p>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(r.price, r.currency)}
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          / {r.product.unit}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Store className="h-3.5 w-3.5" />
                        {r.business.name} · {r.branch.name}
                      </span>
                      {r.distanceKm !== null && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {r.distanceKm} km away
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                    <Badge variant="success" size="sm">
                      {r.availableQuantity} {r.product.unit} left
                    </Badge>
                    <div className="flex gap-1">
                      {r.pickupAvailable && (
                        <Badge variant="neutral" size="sm" className="gap-1">
                          <ShoppingBag size={10} /> Pickup
                        </Badge>
                      )}
                      {r.deliveryAvailable && (
                        <Badge variant="neutral" size="sm" className="gap-1">
                          <Truck size={10} /> Delivery
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="clay-card flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-hover text-muted-foreground">
                <PackageSearch className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No stock found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Try a different spelling or a broader name. Only pharmacies with
                available stock appear here.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <a
              href="/marketplace"
              className="mt-4 inline-block px-1 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              View all results on the marketplace →
            </a>
          )}
        </div>
      )}
    </div>
  );
}