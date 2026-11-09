import test from "node:test";
import assert from "node:assert/strict";
import { selectAuthorizedMembership } from "../../src/modules/businesses/tenant.ts";

test("selects a requested workspace only when it is in the authenticated membership set", () => {
  const memberships = [{ businessId: "tenant-a" }, { businessId: "tenant-b" }];
  assert.equal(selectAuthorizedMembership(memberships, "tenant-b")?.businessId, "tenant-b");
  assert.equal(selectAuthorizedMembership(memberships, "tenant-outsider")?.businessId, "tenant-a");
});

test("uses an authorized membership when the requested workspace is outside the user membership set", () => {
  const memberships = [{ businessId: "tenant-a" }, { businessId: "tenant-b" }];
  assert.equal(selectAuthorizedMembership(memberships)?.businessId, "tenant-a");
  assert.equal(selectAuthorizedMembership(memberships, "other-business")?.businessId, "tenant-a");
  assert.equal(selectAuthorizedMembership([]), undefined);
});
