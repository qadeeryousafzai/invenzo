import test from "node:test";
import assert from "node:assert/strict";
import { addCalendarMonth, getWorkspaceAccessStatus } from "../../src/modules/businesses/subscription.ts";

test("grants a calendar month and clamps at the last day of shorter months", () => {
  assert.equal(addCalendarMonth(new Date("2026-01-31T12:30:00.000Z")).toISOString(), "2026-02-28T12:30:00.000Z");
  assert.equal(addCalendarMonth(new Date("2026-03-31T12:30:00.000Z")).toISOString(), "2026-04-30T12:30:00.000Z");
  assert.equal(addCalendarMonth(new Date("2026-12-31T12:30:00.000Z")).toISOString(), "2027-01-31T12:30:00.000Z");
});

test("determines pending, active, expired, and rejected access states", () => {
  const now = new Date("2026-01-15T00:00:00.000Z");
  assert.equal(getWorkspaceAccessStatus({ verificationStatus: "PENDING", subscriptionExpiresAt: null }, now), "PENDING");
  assert.equal(getWorkspaceAccessStatus({ verificationStatus: "VERIFIED", subscriptionExpiresAt: null }, now), "PENDING");
  assert.equal(getWorkspaceAccessStatus({ verificationStatus: "VERIFIED", subscriptionExpiresAt: new Date("2026-02-15T00:00:00.000Z") }, now), "ACTIVE");
  assert.equal(getWorkspaceAccessStatus({ verificationStatus: "VERIFIED", subscriptionExpiresAt: now }, now), "EXPIRED");
  assert.equal(getWorkspaceAccessStatus({ verificationStatus: "REJECTED", subscriptionExpiresAt: new Date("2026-02-15T00:00:00.000Z") }, now), "REJECTED");
});