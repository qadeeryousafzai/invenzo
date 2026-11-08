import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { addCalendarMonths, getRestoredStatus, getWorkspaceAccessStatus } from "@/modules/businesses/subscription";
import { emailBusinessOwnerNotice, findBusinessOwner, recordBusinessEvent } from "@/modules/businesses/lifecycle";

const schema = z.object({
  action: z.enum(["suspend", "temporarily_block", "reactivate", "extend_expiry", "soft_delete", "restore", "delete"]),
  reason: z.string().trim().max(1000).optional(),
  durationDays: z.number().int().min(1).max(3650).optional(),
  expiresAt: z.iso.datetime().optional(),
  confirmation: z.string().max(191).optional(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ businessId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid workspace management action." }, { status: 400 });
    const action = parsed.data.action;
    if (["suspend", "temporarily_block"].includes(action) && !parsed.data.reason) return NextResponse.json({ error: "A reason is required for access restrictions." }, { status: 400 });
    if (action === "extend_expiry" && !parsed.data.expiresAt) return NextResponse.json({ error: "Choose a new expiry date." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, accountStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true, statusReason: true, statusUntil: true, statusBeforeDeletion: true, deletedAt: true, updatedAt: true },
      });
      if (!current) throw new Error("BUSINESS_NOT_FOUND");

      const now = new Date();
      const previousStatus = getWorkspaceAccessStatus(current, now);
      const owner = await findBusinessOwner(tx, businessId);
      const settings = await tx.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
      let nextStatus = current.accountStatus;
      let updateData: Prisma.BusinessUpdateManyMutationInput;
      let eventAction: string;
      let reason = parsed.data.reason ?? null;
      let metadata: Prisma.InputJsonValue | undefined;
      let ownerNotice: { type: string; title: string; body: string };
      let adminNotice: { type: string; title: string; body: string };

      switch (action) {
        case "suspend":
        case "temporarily_block": {
          if (["PENDING_APPROVAL", "REJECTED", "DELETED"].includes(previousStatus)) throw new Error("BUSINESS_NOT_ELIGIBLE_TO_RESTRICT");
          nextStatus = action === "suspend" ? "SUSPENDED" : "TEMPORARILY_BLOCKED";
          const until = action === "temporarily_block" && parsed.data.durationDays
            ? new Date(now.getTime() + parsed.data.durationDays * 24 * 60 * 60 * 1000)
            : null;
          updateData = { accountStatus: nextStatus, statusReason: reason, statusUntil: until, statusChangedAt: now };
          eventAction = action === "suspend" ? "business.suspended" : "business.temporarily_blocked";
          metadata = { ...(until ? { until: until.toISOString() } : {}), ...(parsed.data.durationDays ? { durationDays: parsed.data.durationDays } : {}) };
          ownerNotice = action === "suspend"
            ? { type: "business.suspended", title: "Business account suspended", body: `${current.name} has been suspended. Reason: ${reason}` }
            : { type: "business.temporarily_blocked", title: "Business account temporarily blocked", body: `${current.name} has been temporarily blocked${until ? ` until ${until.toISOString().slice(0, 10)}` : ""}. Reason: ${reason}` };
          adminNotice = { type: eventAction, title: action === "suspend" ? "Business account suspended" : "Business account temporarily blocked", body: `${current.name} was restricted by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
          break;
        }
        case "reactivate": {
          if (!["SUSPENDED", "TEMPORARILY_BLOCKED", "EXPIRED"].includes(previousStatus)) throw new Error("BUSINESS_NOT_ELIGIBLE_TO_REACTIVATE");
          const expiresAt = parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : current.subscriptionExpiresAt && current.subscriptionExpiresAt > now
              ? current.subscriptionExpiresAt
              : addCalendarMonths(now, settings.defaultAccessMonths);
          if (expiresAt <= now) throw new Error("INVALID_EXPIRY");
          nextStatus = "ACTIVE";
          updateData = { accountStatus: nextStatus, subscriptionStartedAt: current.subscriptionExpiresAt && current.subscriptionExpiresAt > now ? current.subscriptionStartedAt : now, subscriptionExpiresAt: expiresAt, statusReason: null, statusUntil: null, statusBeforeDeletion: null, statusChangedAt: now };
          eventAction = "business.reactivated";
          metadata = { expiresAt: expiresAt.toISOString(), administrator: admin.id };
          reason = parsed.data.reason ?? null;
          ownerNotice = { type: "business.reactivated", title: "Business account access restored", body: `${current.name} is active until ${expiresAt.toISOString().slice(0, 10)}.` };
          adminNotice = { type: "business.reactivated", title: "Business account reactivated", body: `${current.name} was reactivated by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
          break;
        }
        case "extend_expiry": {
          if (previousStatus !== "ACTIVE") throw new Error("BUSINESS_NOT_ACTIVE");
          const expiresAt = new Date(parsed.data.expiresAt!);
          if (expiresAt <= now || (current.subscriptionExpiresAt && expiresAt <= current.subscriptionExpiresAt)) throw new Error("INVALID_EXPIRY");
          nextStatus = "ACTIVE";
          updateData = { subscriptionExpiresAt: expiresAt };
          eventAction = "business.expiry_extended";
          metadata = { expiresAt: expiresAt.toISOString() };
          reason = parsed.data.reason ?? null;
          ownerNotice = { type: "business.expiry_extended", title: "Business account expiry extended", body: `${current.name} is active until ${expiresAt.toISOString().slice(0, 10)}.` };
          adminNotice = { type: "business.expiry_extended", title: "Business account expiry extended", body: `${current.name} now has access until ${expiresAt.toISOString().slice(0, 10)}.` };
          break;
        }
        case "soft_delete": {
          if (current.accountStatus === "DELETED" || current.deletedAt) throw new Error("BUSINESS_ALREADY_DELETED");
          nextStatus = "DELETED";
          updateData = { accountStatus: nextStatus, deletedAt: now, statusBeforeDeletion: current.accountStatus, statusUntil: current.statusUntil, statusChangedAt: now };
          eventAction = "business.soft_deleted";
          metadata = { dataRetained: true };
          ownerNotice = { type: "business.deleted", title: "Business workspace deleted", body: `${current.name} was soft deleted by a platform administrator. Its data is retained.` };
          adminNotice = { type: "business.deleted", title: "Business workspace soft deleted", body: `${current.name} was soft deleted; its data remains available for restoration.` };
          break;
        }
        case "restore": {
          if (current.accountStatus !== "DELETED" || !current.deletedAt) throw new Error("BUSINESS_NOT_DELETED");
          nextStatus = getRestoredStatus(current.statusBeforeDeletion, current.subscriptionExpiresAt, current.statusUntil, now);
          updateData = { accountStatus: nextStatus, deletedAt: null, statusBeforeDeletion: null, statusReason: ["SUSPENDED", "TEMPORARILY_BLOCKED"].includes(nextStatus) ? current.statusReason : null, statusUntil: nextStatus === "TEMPORARILY_BLOCKED" ? current.statusUntil : null, statusChangedAt: now };
          eventAction = "business.restored";
          metadata = { dataRetained: true };
          ownerNotice = { type: "business.restored", title: "Business workspace restored", body: `${current.name} has been restored with status ${nextStatus.toLowerCase().replaceAll("_", " ")}.` };
          adminNotice = { type: "business.restored", title: "Business workspace restored", body: `${current.name} was restored by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
          break;
        }
        case "delete": {
          if (current.accountStatus !== "DELETED" || !current.deletedAt) throw new Error("SOFT_DELETE_REQUIRED");
          if (parsed.data.confirmation !== current.name) throw new Error("CONFIRMATION_MISMATCH");
          nextStatus = "DELETED";
          eventAction = "business.permanently_deleted";
          metadata = { dataRetained: false, name: current.name };
          reason = parsed.data.reason ?? "Permanent deletion confirmed by platform administrator.";
          ownerNotice = { type: "business.permanently_deleted", title: "Business data permanently deleted", body: `${current.name} and its workspace data were permanently deleted.` };
          adminNotice = { type: "business.permanently_deleted", title: "Business workspace permanently deleted", body: `${current.name} and its workspace data were permanently deleted by ${admin.name ?? admin.email ?? "a platform administrator"}.` };
          await recordBusinessEvent(tx, { businessId, businessName: current.name, ownerUserId: owner?.id, actorId: admin.id, previousStatus, newStatus: nextStatus, reason, action: eventAction, metadata, now, adminNotice, ownerNotice });
          await tx.business.delete({ where: { id: businessId } });
          return { business: { id: businessId, name: current.name, accountStatus: "DELETED" as const, deletedAt: now }, ownerEmail: owner?.email, ownerNotice };
        }
      }

      const changed = await tx.business.updateMany({ where: { id: businessId, accountStatus: current.accountStatus, updatedAt: current.updatedAt }, data: updateData! });
      if (changed.count !== 1) throw new Error("BUSINESS_CHANGED_CONCURRENTLY");
      await recordBusinessEvent(tx, {
        businessId,
        businessName: current.name,
        ownerUserId: owner?.id,
        actorId: admin.id,
        previousStatus,
        newStatus: nextStatus,
        reason,
        action: eventAction!,
        metadata,
        now,
        adminNotice: adminNotice!,
        ownerNotice: ownerNotice!,
      });
      const business = await tx.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, accountStatus: true, subscriptionStartedAt: true, subscriptionExpiresAt: true, statusReason: true, statusUntil: true, statusBeforeDeletion: true, deletedAt: true } });
      return { business, ownerEmail: owner?.email, ownerNotice: ownerNotice! };
    });

    await emailBusinessOwnerNotice(result.ownerEmail, result.ownerNotice);
    return NextResponse.json({ data: result.business });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    if (error instanceof Error && error.message === "BUSINESS_ALREADY_DELETED") return NextResponse.json({ error: "Workspace is already soft deleted." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_DELETED") return NextResponse.json({ error: "Workspace is not soft deleted." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_ELIGIBLE_TO_RESTRICT") return NextResponse.json({ error: "Pending, rejected, or deleted accounts cannot be restricted with this action." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_ELIGIBLE_TO_REACTIVATE") return NextResponse.json({ error: "Only suspended, temporarily blocked, or expired accounts can be reactivated." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_ACTIVE") return NextResponse.json({ error: "Only active accounts can have their expiry extended. Use reactivate for restricted accounts." }, { status: 409 });
    if (error instanceof Error && error.message === "SOFT_DELETE_REQUIRED") return NextResponse.json({ error: "Soft delete the workspace before permanently deleting it." }, { status: 409 });
    if (error instanceof Error && error.message === "INVALID_EXPIRY") return NextResponse.json({ error: "The expiry date must be in the future." }, { status: 400 });
    if (error instanceof Error && error.message === "CONFIRMATION_MISMATCH") return NextResponse.json({ error: "The workspace name confirmation did not match." }, { status: 400 });
    if (error instanceof Error && error.message === "BUSINESS_CHANGED_CONCURRENTLY") return NextResponse.json({ error: "This workspace changed while you were updating it. Refresh and try again." }, { status: 409 });
    console.error("Workspace management action failed", error);
    return NextResponse.json({ error: "Workspace could not be updated." }, { status: 500 });
  }
}
