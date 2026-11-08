import { randomUUID } from "node:crypto";
import { Prisma, type BusinessAccountStatus } from "@prisma/client";
import { safeNotificationEmailHtml, sendTransactionalEmail } from "@/lib/email";

type Tx = Prisma.TransactionClient;

type Notice = { type: string; title: string; body: string };

type RecordBusinessEvent = {
  businessId: string;
  businessName: string;
  ownerUserId?: string | null;
  actorId?: string | null;
  previousStatus?: BusinessAccountStatus | null;
  newStatus?: BusinessAccountStatus | null;
  reason?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
  adminNotice?: Notice;
  ownerNotice?: Notice;
  eventKey?: string;
  skipIfDuplicate?: boolean;
  now?: Date;
};

/** Persist status history, immutable audit context, and recipient-specific notices in the same transaction as the state change. */
export async function recordBusinessEvent(tx: Tx, event: RecordBusinessEvent) {
  const now = event.now ?? new Date();
  const eventKey = event.eventKey ?? randomUUID();
  const metadata = {
    ...(event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {}),
    ...(event.previousStatus ? { previousStatus: event.previousStatus } : {}),
    ...(event.newStatus ? { newStatus: event.newStatus } : {}),
    ...(event.reason ? { reason: event.reason } : {}),
  } as Prisma.InputJsonValue;

  const notifications: Prisma.NotificationCreateManyInput[] = [];
  if (event.adminNotice) {
    const admins = await tx.user.findMany({
      where: { platformRole: "SUPER_ADMIN", disabledAt: null, deletedAt: null },
      select: { id: true },
    });
    const recipients = admins.length ? admins.map((admin) => admin.id) : [null];
    for (const userId of recipients) {
      notifications.push({
        userId,
        businessId: event.businessId,
        audience: "PLATFORM_ADMIN",
        type: event.adminNotice.type,
        title: event.adminNotice.title,
        body: event.adminNotice.body,
        dedupeKey: `${eventKey}:admin:${userId ?? "platform"}`,
        createdAt: now,
      });
    }
  }
  if (event.ownerNotice && event.ownerUserId) {
    notifications.push({
      userId: event.ownerUserId,
      businessId: event.businessId,
      audience: "BUSINESS_USER",
      type: event.ownerNotice.type,
      title: event.ownerNotice.title,
      body: event.ownerNotice.body,
      dedupeKey: `${eventKey}:owner:${event.ownerUserId}`,
      createdAt: now,
    });
  }
  const inserted = notifications.length ? await tx.notification.createMany({ data: notifications, skipDuplicates: true }) : { count: 0 };
  if (event.skipIfDuplicate && notifications.length > 0 && inserted.count === 0) return false;

  if (event.newStatus) {
    await tx.businessStatusHistory.create({
      data: {
        businessId: event.businessId,
        businessName: event.businessName,
        actorId: event.actorId ?? null,
        previousStatus: event.previousStatus ?? null,
        newStatus: event.newStatus,
        reason: event.reason ?? null,
        metadata,
        createdAt: now,
      },
    });
  }

  await tx.auditLog.create({
    data: {
      businessId: event.businessId,
      userId: event.actorId ?? null,
      action: event.action,
      entity: "business",
      entityId: event.businessId,
      metadata,
      createdAt: now,
    },
  });
  return true;
}

export async function findBusinessOwner(tx: Tx, businessId: string) {
  const owner = await tx.membership.findFirst({
    where: { businessId, role: { key: "OWNER" } },
    select: { userId: true, user: { select: { id: true, name: true, email: true } } },
  });
  return owner?.user ?? null;
}

export async function emailBusinessOwnerNotice(email: string | null | undefined, notice: Notice) {
  if (!email) return;
  try {
    await sendTransactionalEmail(email, notice.title, safeNotificationEmailHtml(notice.title, notice.body));
  } catch (error) {
    console.error("Business lifecycle notification email failed", error);
  }
}
