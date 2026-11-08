import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { addCalendarMonth, getWorkspaceAccessStatus } from "@/modules/businesses/subscription";

export async function PATCH(request: Request, context: { params: Promise<{ businessId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = z.object({ action: z.enum(["approve", "reject", "renew"]) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid workspace action." }, { status: 400 });
    const business = await prisma.$transaction(async (tx) => {
      const current = await tx.business.findUnique({ where: { id: businessId }, select: { verificationStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true, accessPausedAt: true, deletedAt: true } });
      if (!current) throw new Error("BUSINESS_NOT_FOUND");
      if (current.deletedAt) throw new Error("BUSINESS_ARCHIVED");

      const now = new Date();
      let data;
      let action: string;
      let metadata: Record<string, string> | undefined;

      if (parsed.data.action === "approve") {
        if (!["PENDING", "REJECTED"].includes(getWorkspaceAccessStatus(current, now))) throw new Error("BUSINESS_CANNOT_APPROVE");
        const expiresAt = addCalendarMonth(now);
        data = { verificationStatus: "VERIFIED" as const, subscriptionStartedAt: now, subscriptionExpiresAt: expiresAt };
        action = "business.subscription.approved";
        metadata = { paymentMethod: "OFFLINE", accessUntil: expiresAt.toISOString() };
      } else if (parsed.data.action === "reject") {
        if (getWorkspaceAccessStatus(current, now) !== "PENDING") throw new Error("BUSINESS_CANNOT_REJECT");
        data = { verificationStatus: "REJECTED" as const };
        action = "business.rejected";
      } else {
        if (current.verificationStatus !== "VERIFIED") throw new Error("BUSINESS_NOT_APPROVED");
        const renewalStartsAt = current.subscriptionExpiresAt && current.subscriptionExpiresAt > now ? current.subscriptionExpiresAt : now;
        const expiresAt = addCalendarMonth(renewalStartsAt);
        data = { subscriptionStartedAt: renewalStartsAt, subscriptionExpiresAt: expiresAt };
        action = "business.subscription.renewed";
        metadata = { paymentMethod: "OFFLINE", accessUntil: expiresAt.toISOString() };
      }

      const updated = await tx.business.update({ where: { id: businessId }, data, select: { id: true, name: true, verificationStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true } });
      await tx.auditLog.create({ data: { businessId, userId: admin.id, action, entity: "business", entityId: businessId, metadata } });
      return updated;
    });
    return NextResponse.json({ data: business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") return NextResponse.json({ error: "Business not found." }, { status: 404 });
    if (error instanceof Error && error.message === "BUSINESS_ARCHIVED") return NextResponse.json({ error: "Restore the archived workspace before changing access." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_ALREADY_ACTIVE") return NextResponse.json({ error: "This workspace is already active. Use renewal to extend its access." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_APPROVE") return NextResponse.json({ error: "Only pending or rejected workspace requests can be approved. Use renewal or restore instead." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_REJECT") return NextResponse.json({ error: "Only pending workspace requests can be rejected. Use pause to temporarily suspend existing access." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_APPROVED") return NextResponse.json({ error: "Approve the workspace before renewing access." }, { status: 409 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Business not found." }, { status: 404 });
    console.error("Business verification failed", error);
    return NextResponse.json({ error: "Verification status could not be updated." }, { status: 500 });
  }
}
