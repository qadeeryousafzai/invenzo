import test from "node:test";
import assert from "node:assert/strict";
import { addCalendarMonth, addCalendarMonths, getRestoredStatus, getWorkspaceAccessStatus } from "../../src/modules/businesses/subscription.ts";

test("grants configurable calendar months and clamps at shorter month ends", () => {
  assert.equal(addCalendarMonth(new Date("2026-01-31T12:30:00.000Z")).toISOString(), "2026-02-28T12:30:00.000Z");
  assert.equal(addCalendarMonth(new Date("2026-03-31T12:30:00.000Z")).toISOString(), "2026-04-30T12:30:00.000Z");
  assert.equal(addCalendarMonth(new Date("2026-12-31T12:30:00.000Z")).toISOString(), "2027-01-31T12:30:00.000Z");
  assert.equal(addCalendarMonths(new Date("2024-02-29T00:00:00.000Z"), 12).toISOString(), "2025-02-28T00:00:00.000Z");
  assert.throws(() => addCalendarMonths(new Date(), 0), RangeError);
});

test("enforces all persisted account statuses and expiration precedence", () => {
  const now = new Date("2026-01-15T00:00:00.000Z");
  const future = new Date("2026-02-15T00:00:00.000Z");
  const past = new Date("2026-01-14T00:00:00.000Z");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "PENDING_APPROVAL", subscriptionExpiresAt: null }, now), "PENDING_APPROVAL");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "ACTIVE", subscriptionExpiresAt: future }, now), "ACTIVE");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "ACTIVE", subscriptionExpiresAt: past }, now), "EXPIRED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "REJECTED", subscriptionExpiresAt: future }, now), "REJECTED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "SUSPENDED", subscriptionExpiresAt: future }, now), "SUSPENDED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "SUSPENDED", subscriptionExpiresAt: past }, now), "EXPIRED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "TEMPORARILY_BLOCKED", subscriptionExpiresAt: future, statusUntil: future }, now), "TEMPORARILY_BLOCKED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "TEMPORARILY_BLOCKED", subscriptionExpiresAt: future, statusUntil: past }, now), "ACTIVE");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "TEMPORARILY_BLOCKED", subscriptionExpiresAt: past, statusUntil: future }, now), "EXPIRED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "EXPIRED", subscriptionExpiresAt: future }, now), "EXPIRED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "DELETED", subscriptionExpiresAt: future }, now), "DELETED");
  assert.equal(getWorkspaceAccessStatus({ accountStatus: "ACTIVE", subscriptionExpiresAt: future, deletedAt: now }, now), "DELETED");
});

test("restores soft-deleted accounts without creating a new business identity", () => {
  const now = new Date("2026-01-15T00:00:00.000Z");
  const future = new Date("2026-02-15T00:00:00.000Z");
  const past = new Date("2026-01-14T00:00:00.000Z");
  assert.equal(getRestoredStatus("ACTIVE", future, null, now), "ACTIVE");
  assert.equal(getRestoredStatus("SUSPENDED", future, null, now), "SUSPENDED");
  assert.equal(getRestoredStatus("TEMPORARILY_BLOCKED", future, future, now), "TEMPORARILY_BLOCKED");
  assert.equal(getRestoredStatus("TEMPORARILY_BLOCKED", future, past, now), "ACTIVE");
  assert.equal(getRestoredStatus("ACTIVE", past, null, now), "EXPIRED");
});
