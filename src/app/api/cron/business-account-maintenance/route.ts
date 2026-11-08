import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailBusinessOwnerNotice, findBusinessOwner, recordBusinessEvent } from "@/modules/businesses/lifecycle";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const presented = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!secret || !presented) return false;
  const expectedBuffer = Buffer.from(secret);
  const presentedBuffer = Buffer.from(presented);
  return expectedBuffer.length === presentedBuffer.length && timingSafeEqual(expectedBuffer, presentedBuffer);
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Scheduled maintenance is not configured." }, { status: 503 });
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
    const now = new Date();
    let expired = 0;
    let unblocked = 0;
    let expiryWarnings = 0;

    let expiryCursor: string | undefined;
    while (true) {
      const businesses = await prisma.business.findMany({
        where: { deletedAt: null, accountStatus: { in: ["ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED"] }, subscriptionExpiresAt: { lte: now } },
        select: { id: true, name: true, accountStatus: true, subscriptionExpiresAt: true, statusUntil: true, statusReason: true, updatedAt: true },
        orderBy: { id: "asc" },
        take: 100,
        ...(expiryCursor ? { cursor: { id: expiryCursor }, skip: 1 } : {}),
      });
      if (!businesses.length) break;
      for (const business of businesses) {
        const changed = await prisma.$transaction(async (tx) => {
          const result = await tx.business.updateMany({
            where: { id: business.id, accountStatus: business.accountStatus, updatedAt: business.updatedAt, deletedAt: null, subscriptionExpiresAt: { lte: now } },
            data: { accountStatus: "EXPIRED", statusReason: null, statusUntil: null, statusChangedAt: now },
          });
          if (result.count !== 1) return null;
          const owner = await findBusinessOwner(tx, business.id);
          const notice = { type: "business.expired", title: "Business account expired", body: `Access for ${business.name} has expired. Its workspace data remains saved.` };
          await recordBusinessEvent(tx, {
            businessId: business.id,
            businessName: business.name,
            ownerUserId: owner?.id,
            previousStatus: business.accountStatus,
            newStatus: "EXPIRED",
            action: "business.expired",
            metadata: { expiresAt: business.subscriptionExpiresAt?.toISOString() ?? null, automated: true },
            now,
            adminNotice: { type: "business.expired", title: "Business account expired", body: `${business.name} expired. Its account and business data are retained.` },
            ownerNotice: notice,
          });
          return { email: owner?.email, notice };
        });
        if (changed) {
          expired += 1;
          await emailBusinessOwnerNotice(changed.email, changed.notice);
        }
      }
      expiryCursor = businesses[businesses.length - 1].id;
      if (businesses.length < 100) break;
    }

    let blockCursor: string | undefined;
    while (true) {
      const businesses = await prisma.business.findMany({
        where: { deletedAt: null, accountStatus: "TEMPORARILY_BLOCKED", statusUntil: { lte: now }, subscriptionExpiresAt: { gt: now } },
        select: { id: true, name: true, accountStatus: true, subscriptionExpiresAt: true, statusUntil: true, updatedAt: true },
        orderBy: { id: "asc" },
        take: 100,
        ...(blockCursor ? { cursor: { id: blockCursor }, skip: 1 } : {}),
      });
      if (!businesses.length) break;
      for (const business of businesses) {
        const changed = await prisma.$transaction(async (tx) => {
          const result = await tx.business.updateMany({ where: { id: business.id, accountStatus: "TEMPORARILY_BLOCKED", updatedAt: business.updatedAt, statusUntil: { lte: now }, subscriptionExpiresAt: { gt: now }, deletedAt: null }, data: { accountStatus: "ACTIVE", statusReason: null, statusUntil: null, statusChangedAt: now } });
          if (result.count !== 1) return null;
          const owner = await findBusinessOwner(tx, business.id);
          const notice = { type: "business.reactivated", title: "Temporary account restriction ended", body: `Temporary access restriction for ${business.name} ended. Your account is active again.` };
          await recordBusinessEvent(tx, {
            businessId: business.id,
            businessName: business.name,
            ownerUserId: owner?.id,
            previousStatus: "TEMPORARILY_BLOCKED",
            newStatus: "ACTIVE",
            action: "business.temporary_block_ended",
            metadata: { expiresAt: business.subscriptionExpiresAt?.toISOString() ?? null, automated: true },
            now,
            adminNotice: { type: "business.temporary_block_ended", title: "Temporary account block ended", body: `The temporary block for ${business.name} ended automatically.` },
            ownerNotice: notice,
          });
          return { email: owner?.email, notice };
        });
        if (changed) {
          unblocked += 1;
          await emailBusinessOwnerNotice(changed.email, changed.notice);
        }
      }
      blockCursor = businesses[businesses.length - 1].id;
      if (businesses.length < 100) break;
    }

    if (settings.expiryWarningDays > 0) {
      const warningThrough = new Date(now.getTime() + settings.expiryWarningDays * 24 * 60 * 60 * 1000);
      let cursor: string | undefined;
      while (true) {
        const businesses = await prisma.business.findMany({
          where: { deletedAt: null, accountStatus: { in: ["ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED"] }, subscriptionExpiresAt: { gt: now, lte: warningThrough } },
          select: { id: true, name: true, accountStatus: true, subscriptionExpiresAt: true },
          orderBy: { id: "asc" },
          take: 100,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        if (!businesses.length) break;
        for (const business of businesses) {
          if (!business.subscriptionExpiresAt) continue;
          const expiryKey = `expiry-warning:${business.id}:${business.subscriptionExpiresAt.getTime()}`;
          const alreadyNotified = await prisma.notification.findFirst({ where: { businessId: business.id, type: "business.expiring", dedupeKey: { startsWith: `${expiryKey}:` } }, select: { id: true } });
          if (alreadyNotified) continue;
          const ownerNotice = { type: "business.expiring", title: "Business account nearing expiry", body: `${business.name} access ends on ${business.subscriptionExpiresAt.toISOString().slice(0, 10)}. Contact the platform administrator to plan renewal.` };
          const changed = await prisma.$transaction(async (tx) => {
            const current = await tx.business.findUnique({ where: { id: business.id }, select: { accountStatus: true, subscriptionExpiresAt: true, deletedAt: true } });
            if (!current || current.deletedAt || !["ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED"].includes(current.accountStatus) || current.subscriptionExpiresAt?.getTime() !== business.subscriptionExpiresAt?.getTime()) return false;
            const alreadyNotifiedInTransaction = await tx.notification.findFirst({ where: { businessId: business.id, type: "business.expiring", dedupeKey: { startsWith: `${expiryKey}:` } }, select: { id: true } });
            if (alreadyNotifiedInTransaction) return false;
            const owner = await findBusinessOwner(tx, business.id);
            const recorded = await recordBusinessEvent(tx, {
              businessId: business.id,
              businessName: business.name,
              ownerUserId: owner?.id,
              previousStatus: "ACTIVE",
              action: "business.expiry_warning_sent",
              metadata: { expiresAt: business.subscriptionExpiresAt!.toISOString(), warningDays: settings.expiryWarningDays, automated: true },
              eventKey: expiryKey,
              skipIfDuplicate: true,
              now,
              adminNotice: { type: "business.expiring", title: "Business account nearing expiry", body: `${business.name} access ends on ${business.subscriptionExpiresAt!.toISOString().slice(0, 10)}.` },
              ownerNotice,
            });
            if (!recorded) return false;
            return { email: owner?.email };
          });
          if (changed) {
            expiryWarnings += 1;
            await emailBusinessOwnerNotice(changed.email, ownerNotice);
          }
        }
        cursor = businesses[businesses.length - 1].id;
        if (businesses.length < 100) break;
      }
    }

    return NextResponse.json({ data: { expired, unblocked, expiryWarnings, checkedAt: now.toISOString() } });
  } catch (error) {
    console.error("Scheduled business account maintenance failed", error);
    return NextResponse.json({ error: "Scheduled account maintenance could not be completed." }, { status: 500 });
  }
}
