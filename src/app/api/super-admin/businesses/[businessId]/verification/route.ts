import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ businessId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = z.object({ status: z.enum(["VERIFIED", "REJECTED"]) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid verification result." }, { status: 400 });
    const business = await prisma.$transaction(async (tx) => {
      const updated = await tx.business.update({ where: { id: businessId }, data: { verificationStatus: parsed.data.status }, select: { id: true, name: true, verificationStatus: true } });
      await tx.auditLog.create({ data: { businessId, userId: admin.id, action: `business.${parsed.data.status.toLowerCase()}`, entity: "business", entityId: businessId } });
      return updated;
    });
    return NextResponse.json({ data: business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Business not found." }, { status: 404 });
    console.error("Business verification failed", error);
    return NextResponse.json({ error: "Verification status could not be updated." }, { status: 500 });
  }
}
