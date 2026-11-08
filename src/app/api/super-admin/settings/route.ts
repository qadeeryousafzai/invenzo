import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export async function GET() {
  try {
    await requireSuperAdmin();
    const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
    return NextResponse.json({ data: settings });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Platform settings read failed", error);
    return NextResponse.json({ error: "Platform settings could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const parsed = z.object({ defaultAccessMonths: z.number().int().min(1).max(120), expiryWarningDays: z.number().int().min(0).max(90) }).strict().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Set an access period from 1 to 120 months and a warning period from 0 to 90 days." }, { status: 400 });
    const settings = await prisma.$transaction(async (tx) => {
      const updated = await tx.platformSettings.upsert({ where: { id: "default" }, update: parsed.data, create: { id: "default", ...parsed.data } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "platform.settings_updated", entity: "platform_settings", entityId: "default", metadata: parsed.data } });
      return updated;
    });
    return NextResponse.json({ data: settings });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Platform settings update failed", error);
    return NextResponse.json({ error: "Platform settings could not be updated." }, { status: 500 });
  }
}
