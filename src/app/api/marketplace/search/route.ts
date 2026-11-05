import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(120).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
}).strict();

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const limitCheck = rateLimit(`market-search:${requestIp(request)}`, 120, 60 * 60 * 1000);
  if (!limitCheck.allowed) return NextResponse.json({ error: "Too many searches. Please try again later." }, { status: 429, headers: { "Retry-After": String(limitCheck.retryAfter) } });

  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    latitude: params.has("latitude") ? params.get("latitude") : undefined,
    longitude: params.has("longitude") ? params.get("longitude") : undefined,
    limit: params.get("limit") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Search parameters are invalid.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { q, category, latitude, longitude, limit } = parsed.data;
  if ((latitude === undefined) !== (longitude === undefined)) return NextResponse.json({ error: "Provide both latitude and longitude to sort by distance." }, { status: 400 });

  try {
    const now = new Date();
    const listings = await prisma.productListing.findMany({
      where: {
        marketplaceEnabled: true,
        business: { verificationStatus: "VERIFIED", deletedAt: null },
        branch: { status: "ACTIVE", deletedAt: null },
        product: {
          deletedAt: null,
          ...(category ? { category: { equals: category } } : {}),
          ...(q ? { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] } : {}),
        },
        batches: { some: { quantityRemaining: { gt: 0 }, archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] } },
      },
      include: {
        business: { select: { name: true, slug: true, logoUrl: true, currency: true } },
        branch: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
        product: { select: { id: true, name: true, sku: true, brand: true, category: true, description: true, imageUrl: true, unit: true } },
        batches: {
          where: { quantityRemaining: { gt: 0 }, archivedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gt: now } }] },
          select: { quantityRemaining: true },
        },
      },
      take: Math.min(limit * 5, 250),
    });

    const results = listings.map((listing) => {
      const availableQuantity = listing.batches.reduce((total, batch) => total + Number(batch.quantityRemaining), 0);
      const branchLatitude = listing.branch.latitude === null ? null : Number(listing.branch.latitude);
      const branchLongitude = listing.branch.longitude === null ? null : Number(listing.branch.longitude);
      const distance = latitude !== undefined && longitude !== undefined && branchLatitude !== null && branchLongitude !== null
        ? distanceKm(latitude, longitude, branchLatitude, branchLongitude)
        : null;
      return {
        listingId: listing.id,
        product: listing.product,
        price: Number(listing.price),
        currency: listing.business.currency,
        availableQuantity,
        pickupAvailable: listing.pickupEnabled,
        deliveryAvailable: listing.deliveryEnabled,
        business: { name: listing.business.name, slug: listing.business.slug, logoUrl: listing.business.logoUrl },
        branch: { ...listing.branch, latitude: branchLatitude, longitude: branchLongitude },
        distanceKm: distance === null ? null : Math.round(distance * 10) / 10,
      };
    });

    results.sort((a, b) => {
      if (latitude !== undefined) {
        if (a.distanceKm === null && b.distanceKm !== null) return 1;
        if (a.distanceKm !== null && b.distanceKm === null) return -1;
        if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      } else if (a.availableQuantity !== b.availableQuantity) {
        return b.availableQuantity - a.availableQuantity;
      }
      return a.price - b.price;
    });

    return NextResponse.json({ data: results.slice(0, limit), meta: { count: Math.min(results.length, limit), locationSorted: latitude !== undefined } }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch (error) {
    console.error("Marketplace search failed", error);
    const code = error instanceof Error && "code" in error ? String(error.code) : undefined;
    const databaseNotReady = code === "P2021" || code === "P2022";
    return NextResponse.json({ error: databaseNotReady ? "Product search is not set up yet. Apply the Invenzo database migrations, then try again." : "Product search is temporarily unavailable." }, { status: 503 });
  }
}
