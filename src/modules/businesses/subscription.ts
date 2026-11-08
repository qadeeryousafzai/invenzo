export type WorkspaceSubscription = {
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  subscriptionExpiresAt: Date | null;
  accessPausedAt?: Date | null;
  deletedAt?: Date | null;
};

export type WorkspaceAccessStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "REJECTED" | "PAUSED" | "ARCHIVED";

export function getWorkspaceAccessStatus(business: WorkspaceSubscription, now = new Date()): WorkspaceAccessStatus {
  if (business.deletedAt) return "ARCHIVED";
  if (business.accessPausedAt) return "PAUSED";
  if (business.verificationStatus === "REJECTED") return "REJECTED";
  if (business.verificationStatus !== "VERIFIED" || !business.subscriptionExpiresAt) return "PENDING";
  return business.subscriptionExpiresAt > now ? "ACTIVE" : "EXPIRED";
}

export function addCalendarMonth(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDayOfMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDayOfMonth));
  return result;
}