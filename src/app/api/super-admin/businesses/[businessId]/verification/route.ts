import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { addCalendarMonths, getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import { emailBusinessOwnerNotice, findBusinessOwner, recordBusinessEvent } from "@/modules/businesses/lifecycle";

const schema = z.object({
  action: z.enum(["approve", "reject", "renew", "extend"]),
  reason: z.string().trim().min(1).max(1000).optional(),
  expiresAt: z.iso.datetime().optional(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ businessId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid account action and provide valid details." }, { status: 400 });
    const action = parsed.data.action;
    if (action === "reject" && !parsed.data.reason) return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
    if (action === "extend" && !parsed.data.expiresAt) return NextResponse.json({ error: "Choose a new expiry date." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, email: true, accountStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true, statusUntil: true, statusReason: true, rejectionReason: true, deletedAt: true, statusBeforeDeletion: true, updatedAt: true },
      });
      if (!current) throw new Error("BUSINESS_NOT_FOUND");
      if (current.deletedAt || current.accountStatus === "DELETED") throw new Error("BUSINESS_DELETED");

      const now = new Date();
      const previousStatus = getWorkspaceAccessStatus(current, now);
      const owner = await findBusinessOwner(tx, businessId);
      const settings = await tx.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
      let nextStatus = current.accountStatus;
      let updateData: Prisma.BusinessUncheckedUpdateManyInput;
      let eventAction: string;
      let eventReason = parsed.data.reason ?? null;
      let metadata: Prisma.InputJsonValue | undefined;
      let ownerNotice: { type: string; title: string; body: string };
      let adminNotice: { type: string; title: string; body: string };

      if (action === "approve") {
        if (previousStatus !== "PENDING_APPROVAL") throw new Error("BUSINESS_CANNOT_APPROVE");
        const expiresAt = addCalendarMonths(now, settings.defaultAccessMonths);
        nextStatus = "ACTIVE";
        updateData = { accountStatus: nextStatus, subscriptionStartedAt: now, subscriptionExpiresAt: expiresAt, approvedById: admin.id, rejectionReason: null, statusReason: null, statusUntil: null, statusBeforeDeletion: null, statusChangedAt: now };
        eventAction = "business.approved";
        metadata = { expiresAt: expiresAt.toISOString(), accessMonths: settings.defaultAccessMonths };
        ownerNotice = { type: "business.approved", title: "Business account approved", body: `${current.name} has been approved. Workspace access is active until ${expiresAt.toISOString().slice(0, 10)}.` };
        adminNotice = { type: "business.approved", title: "Business account approved", body: `${current.name} was approved by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
        eventReason = null;
      } else if (action === "reject") {
        if (previousStatus !== "PENDING_APPROVAL") throw new Error("BUSINESS_CANNOT_REJECT");
        nextStatus = "REJECTED";
        updateData = { accountStatus: nextStatus, rejectionReason: parsed.data.reason, statusReason: parsed.data.reason, statusUntil: null, statusChangedAt: now };
        eventAction = "business.rejected";
        ownerNotice = { type: "business.rejected", title: "Business account application rejected", body: `The application for ${current.name} was rejected. Reason: ${parsed.data.reason}` };
        adminNotice = { type: "business.rejected", title: "Business application rejected", body: `${current.name} was rejected by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
      } else if (action === "renew") {
        if (previousStatus !== "ACTIVE" && previousStatus !== "EXPIRED") throw new Error("BUSINESS_CANNOT_RENEW");
        const startsAt = current.subscriptionExpiresAt && current.subscriptionExpiresAt > now ? current.subscriptionExpiresAt : now;
        const expiresAt = addCalendarMonths(startsAt, settings.defaultAccessMonths);
        nextStatus = "ACTIVE";
        updateData = { accountStatus: nextStatus, subscriptionStartedAt: current.subscriptionStartedAt ?? now, subscriptionExpiresAt: expiresAt, statusReason: null, statusUntil: null, statusChangedAt: previousStatus === "EXPIRED" ? now : current.updatedAt };
        eventAction = previousStatus === "EXPIRED" ? "business.reactivated" : "business.expiry_extended";
        metadata = { expiresAt: expiresAt.toISOString(), accessMonths: settings.defaultAccessMonths };
        ownerNotice = { type: "business.reactivated", title: "Business account access restored", body: `${current.name} is active until ${expiresAt.toISOString().slice(0, 10)}.` };
        adminNotice = { type: "business.reactivated", title: "Business account renewed", body: `${current.name} now has access until ${expiresAt.toISOString().slice(0, 10)}.` };
        eventReason = null;
      } else {
        if (previousStatus !== "ACTIVE") throw new Error("BUSINESS_CANNOT_EXTEND");
        const expiresAt = new Date(parsed.data.expiresAt!);
        if (expiresAt <= now || (current.subscriptionExpiresAt && expiresAt <= current.subscriptionExpiresAt)) throw new Error("INVALID_EXPIRY");
        nextStatus = "ACTIVE";
        updateData = { subscriptionExpiresAt: expiresAt };
        eventAction = "business.expiry_extended";
        metadata = { expiresAt: expiresAt.toISOString() };
        ownerNotice = { type: "business.expiry_extended", title: "Business account expiry extended", body: `${current.name} is now active until ${expiresAt.toISOString().slice(0, 10)}.` };
        adminNotice = { type: "business.expiry_extended", title: "Business account expiry extended", body: `${current.name} now has access until ${expiresAt.toISOString().slice(0, 10)}.` };
        eventReason = null;
      }

      const changed = await tx.business.updateMany({ where: { id: businessId, accountStatus: current.accountStatus, updatedAt: current.updatedAt }, data: updateData });
      if (changed.count !== 1) throw new Error("BUSINESS_CHANGED_CONCURRENTLY");
      await recordBusinessEvent(tx, {
        businessId,
        businessName: current.name,
        ownerUserId: owner?.id,
        actorId: admin.id,
        previousStatus,
        newStatus: nextStatus,
        reason: eventReason,
        action: eventAction,
        metadata,
        now,
        adminNotice,
        ownerNotice,
      });
      const updated = await tx.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, accountStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true, approvedById: true, rejectionReason: true } });
      return { business: updated, ownerEmail: owner?.email, ownerNotice };
    });

    await emailBusinessOwnerNotice(result.ownerEmail, result.ownerNotice);
    return NextResponse.json({ data: result.business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") return NextResponse.json({ error: "Business not found." }, { status: 404 });
    if (error instanceof Error && error.message === "BUSINESS_DELETED") return NextResponse.json({ error: "Restore this soft-deleted business before changing its access." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_APPROVE") return NextResponse.json({ error: "Only pending applications can be approved." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_REJECT") return NextResponse.json({ error: "Only pending applications can be rejected." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_RENEW") return NextResponse.json({ error: "Only active or expired accounts can be renewed. Reactivate restricted accounts first." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_CANNOT_EXTEND") return NextResponse.json({ error: "Only active accounts can have their expiry extended. Reactivate restricted accounts first." }, { status: 409 });
    if (error instanceof Error && error.message === "INVALID_EXPIRY") return NextResponse.json({ error: "The new expiry date must be later than today and the current expiry date." }, { status: 400 });
    if (error instanceof Error && error.message === "BUSINESS_CHANGED_CONCURRENTLY") return NextResponse.json({ error: "This account changed while you were updating it. Refresh and try again." }, { status: 409 });
    console.error("Business verification failed", error);
    return NextResponse.json({ error: "Business account could not be updated." }, { status: 500 });
  }
}
