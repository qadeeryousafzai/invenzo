import { NextResponse } from "next/server";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { getCatalogSourceOverview } from "@/modules/catalog/overview";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    await requireSuperAdmin();
    const data = await getCatalogSourceOverview();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/sources] failed", error);
    return NextResponse.json({ error: "Catalog sources could not be loaded." }, { status: 500 });
  }
}