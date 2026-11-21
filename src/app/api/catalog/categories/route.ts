import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    await requireTenantContext("inventory.view");
    const categories = await prisma.medicineCategory.findMany({
      where: { parentId: null },
      select: { id: true, key: true, name: true, parentId: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/categories] failed", error);
    return NextResponse.json({ error: "Categories could not be loaded." }, { status: 500 });
  }
}