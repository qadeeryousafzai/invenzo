import test from "node:test";
import assert from "node:assert/strict";
import { planStockConsumption } from "../../src/modules/inventory/stock.ts";

const now = new Date("2026-04-01T00:00:00.000Z");
const batch = (id, quantityRemaining, expiryDate, receivedAt = "2026-01-01T00:00:00.000Z") => ({ id, quantityRemaining, expiryDate: expiryDate ? new Date(expiryDate) : null, receivedAt: new Date(receivedAt) });

test("allocates stock FEFO across batches and keeps non-expiring stock last", () => {
  const result = planStockConsumption(5, [
    batch("no-expiry", "10", null),
    batch("later-expiry", "4", "2026-08-01T00:00:00.000Z"),
    batch("first-expiry", "2", "2026-05-01T00:00:00.000Z"),
  ], now);
  assert.deepEqual(result, [
    { batchId: "first-expiry", quantity: 2 },
    { batchId: "later-expiry", quantity: 3 },
  ]);
});

test("never allocates expired stock and returns no plan when stock is insufficient", () => {
  const stock = [batch("expired", 100, "2026-03-31T00:00:00.000Z"), batch("valid", 1.25, "2026-05-01T00:00:00.000Z")];
  assert.deepEqual(planStockConsumption(1.25, stock, now), [{ batchId: "valid", quantity: 1.25 }]);
  assert.equal(planStockConsumption(2, stock, now), null);
});

test("preserves three-decimal quantities and rejects invalid precision", () => {
  assert.deepEqual(planStockConsumption(0.333, [batch("fractional", "0.500", null)], now), [{ batchId: "fractional", quantity: 0.333 }]);
  assert.equal(planStockConsumption(0.0001, [batch("fractional", 1, null)], now), null);
  assert.equal(planStockConsumption(-1, [batch("fractional", 1, null)], now), null);
});
