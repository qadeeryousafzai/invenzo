import test from "node:test";
import assert from "node:assert/strict";
import { PLANS, planForKey, planExpiry } from "../../src/modules/billing/plans.ts";

test("maps each plan to its amount, currency, and access months", () => {
  assert.equal(PLANS.monthly.amountMinor, 249900);
  assert.equal(PLANS.monthly.currency, "PKR");
  assert.equal(PLANS.monthly.accessMonths, 1);
  assert.equal(PLANS.yearly.amountMinor, 1999900);
  assert.equal(PLANS.yearly.accessMonths, 12);
  assert.equal(PLANS.lifetime.amountMinor, 4999900);
  assert.equal(PLANS.lifetime.accessMonths, null);
});

test("planForKey returns null for unknown keys", () => {
  assert.equal(planForKey("monthly")?.key, "monthly");
  assert.equal(planForKey("unknown"), null);
});

test("planExpiry returns null for lifetime and a future date otherwise", () => {
  const now = new Date("2026-01-15T00:00:00.000Z");
  assert.equal(planExpiry(PLANS.lifetime, now), null);
  assert.equal(planExpiry(PLANS.monthly, now).toISOString(), "2026-02-15T00:00:00.000Z");
  assert.equal(planExpiry(PLANS.yearly, now).toISOString(), "2027-01-15T00:00:00.000Z");
});
