import type { BusinessAccountStatus } from "@prisma/client";

export type WorkspaceSubscription = {
  accountStatus: BusinessAccountStatus;
  subscriptionExpiresAt: Date | null;
  statusUntil?: Date | null;
  deletedAt?: Date | null;
};

export type WorkspaceAccessStatus = BusinessAccountStatus;

/** Temporary blocks expire automatically; account expiry still takes precedence over access. */
export function getWorkspaceAccessStatus(business: WorkspaceSubscription, now = new Date()): WorkspaceAccessStatus {
  if (business.deletedAt || business.accountStatus === "DELETED") return "DELETED";
  if (["ACTIVE", "SUSPENDED", "TEMPORARILY_BLOCKED"].includes(business.accountStatus) && business.subscriptionExpiresAt && business.subscriptionExpiresAt <= now) return "EXPIRED";
  if (business.accountStatus === "TEMPORARILY_BLOCKED" && (!business.statusUntil || business.statusUntil > now)) return "TEMPORARILY_BLOCKED";
  if (business.accountStatus === "TEMPORARILY_BLOCKED" && business.statusUntil && business.statusUntil <= now) {
    return business.subscriptionExpiresAt && business.subscriptionExpiresAt <= now ? "EXPIRED" : "ACTIVE";
  }
  if (business.accountStatus === "ACTIVE" && (!business.subscriptionExpiresAt || business.subscriptionExpiresAt <= now)) return "EXPIRED";
  return business.accountStatus;
}

export function addCalendarMonths(date: Date, months: number) {
  if (!Number.isInteger(months) || months < 1 || months > 120) throw new RangeError("months must be an integer between 1 and 120");
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDayOfMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDayOfMonth));
  return result;
}

export function addCalendarMonth(date: Date) {
  return addCalendarMonths(date, 1);
}

export function getRestoredStatus(statusBeforeDeletion: BusinessAccountStatus | null, expiresAt: Date | null, statusUntil?: Date | null, now = new Date()): BusinessAccountStatus {
  if (statusBeforeDeletion === "DELETED") return expiresAt && expiresAt > now ? "ACTIVE" : "EXPIRED";
  if (statusBeforeDeletion === "SUSPENDED") return "SUSPENDED";
  if (statusBeforeDeletion === "TEMPORARILY_BLOCKED" && (!statusUntil || statusUntil > now)) return "TEMPORARILY_BLOCKED";
  if (statusBeforeDeletion === "TEMPORARILY_BLOCKED") return expiresAt && expiresAt > now ? "ACTIVE" : "EXPIRED";
  if (statusBeforeDeletion === "ACTIVE" && (!expiresAt || expiresAt <= now)) return "EXPIRED";
  return statusBeforeDeletion ?? (expiresAt && expiresAt > now ? "ACTIVE" : "EXPIRED");
}
