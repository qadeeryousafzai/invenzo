import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ROLES, OWNER_PERMISSION_KEYS, PERMISSIONS } from "../../src/modules/businesses/permissions.ts";

const role = (key) => DEFAULT_ROLES.find((item) => item.key === key);

test("workspace roles expose only their configured operational permissions", () => {
  const owner = role("OWNER");
  const salesperson = role("SALESPERSON");
  const inventoryManager = role("INVENTORY_MANAGER");
  assert.ok(owner);
  assert.deepEqual(new Set(owner.permissions), new Set(OWNER_PERMISSION_KEYS));
  assert.ok(salesperson?.permissions.includes("sales.create"));
  assert.ok(salesperson?.permissions.includes("customers.manage"));
  assert.ok(!salesperson?.permissions.includes("purchases.manage"));
  assert.ok(inventoryManager?.permissions.includes("inventory.adjust"));
  assert.ok(inventoryManager?.permissions.includes("suppliers.manage"));
  assert.ok(!inventoryManager?.permissions.includes("sales.create"));
});

test("new business data modules have explicit server permission keys", () => {
  for (const permission of ["categories.manage", "customers.manage", "suppliers.manage", "expenses.manage", "inventory.adjust", "reports.view"]) {
    assert.ok(Object.hasOwn(PERMISSIONS, permission), `${permission} should be defined`);
  }
});
