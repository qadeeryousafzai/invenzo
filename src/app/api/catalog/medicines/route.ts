import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    await requireTenantContext();
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    const dosageForm = (url.searchParams.get("dosageForm") ?? "").trim();
    const countryCode = (url.searchParams.get("country") ?? "").trim().toUpperCase();
    const sourceKey = (url.searchParams.get("source") ?? "").trim();
    const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? "24") || 24, 1), 100);

    const filters = [];
    if (query) {
      filters.push({
        OR: [
          { displayName: { contains: query } },
          { genericName: { contains: query } },
          { brandName: { contains: query } },
          { searchText: { contains: query } },
          { strengthText: { contains: query } },
        ],
      });
    }
    if (dosageForm) filters.push({ dosageForm: { contains: dosageForm } });
    if (countryCode) filters.push({ countryCode });
    if (sourceKey) filters.push({ source: { key: sourceKey } });

    const where = filters.length ? { AND: filters } : undefined;

    const [total, rows] = await Promise.all([
      prisma.medicine.count({ where }),
      prisma.medicine.findMany({
        where,
        orderBy: [{ displayName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ingredients: { orderBy: { sortOrder: "asc" }, select: { name: true, role: true, strengthText: true } },
          manufacturer: { select: { name: true, countryCode: true } },
          source: { select: { key: true, name: true, countryCode: true, attributionRequired: true } },
          identifiers: { select: { system: true, value: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: rows.map((medicine) => ({
        id: medicine.id,
        canonicalKey: medicine.canonicalKey,
        brandName: medicine.brandName,
        genericName: medicine.genericName,
        displayName: medicine.displayName,
        strengthText: medicine.strengthText,
        dosageForm: medicine.dosageForm,
        route: medicine.route,
        atcCode: medicine.atcCode,
        countryCode: medicine.countryCode,
        regulatoryStatus: medicine.regulatoryStatus,
        manufacturer: medicine.manufacturer ? { name: medicine.manufacturer.name, countryCode: medicine.manufacturer.countryCode } : null,
        source: {
          key: medicine.source.key,
          name: medicine.source.name,
          countryCode: medicine.source.countryCode,
          attributionRequired: medicine.source.attributionRequired,
        },
        ingredients: medicine.ingredients,
        identifiers: medicine.identifiers,
      })),
      meta: { page, pageSize, total, pageCount: Math.max(Math.ceil(total / pageSize), 1) },
    });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/medicines] failed", error);
    return NextResponse.json({ error: "Catalog medicines could not be loaded." }, { status: 500 });
  }
}