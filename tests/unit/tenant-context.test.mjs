import test from "node:test";
import assert from "node:assert/strict";
import { selectAuthorizedMembership } from "../../src/modules/businesses/tenant.ts";

test("selects a requested workspace only when it is in the authenticated membership set", () => {
  const memberships = [{ businessId: "tenant-a" }, { businessId: "tenant-b" }];
  assert.equal(selectAuthorizedMembership(memberships, "tenant-b")?.businessId, "tenant-b");
  assert.equal(selectAuthorizedMembership(memberships, "tenant-outsider")?.businessId, "tenant-a");
});

test("uses the first verified membership when no active workspace has been selected", () => {
  const memberships = [{ businessId: "tenant-a" }, { businessId: "tenant-b" }];
  assert.equal(selectAuthorizedMembership(memberships)?.businessId, "tenant-a");
  assert.equal(selectAuthorizedMembership([]), undefined);
});
