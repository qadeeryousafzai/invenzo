export type AvailableStockBatch = {
  id: string;
  quantityRemaining: number | string;
  expiryDate: Date | null;
  receivedAt: Date;
};

export type StockAllocation = { batchId: string; quantity: number };

/** Build a FEFO allocation in thousandth units; null means the available stock is insufficient. */
export function planStockConsumption(requiredQuantity: number, batches: AvailableStockBatch[], now = new Date()): StockAllocation[] | null {
  if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) return null;
  const requiredMilliunits = Math.round(requiredQuantity * 1000);
  if (requiredMilliunits <= 0 || Math.abs(requiredMilliunits - requiredQuantity * 1000) > 0.00001) return null;
  const eligible = batches
    .map((batch) => ({ ...batch, milliunits: Math.floor(Number(batch.quantityRemaining) * 1000 + 1e-7) }))
    .filter((batch) => batch.milliunits > 0 && (!batch.expiryDate || batch.expiryDate > now))
    .sort((a, b) => {
      const expiryA = a.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const expiryB = b.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return expiryA - expiryB || a.receivedAt.getTime() - b.receivedAt.getTime() || a.id.localeCompare(b.id);
    });
  const total = eligible.reduce((sum, batch) => sum + batch.milliunits, 0);
  if (total < requiredMilliunits) return null;
  let remaining = requiredMilliunits;
  const allocations: StockAllocation[] = [];
  for (const batch of eligible) {
    if (remaining === 0) break;
    const quantity = Math.min(remaining, batch.milliunits);
    allocations.push({ batchId: batch.id, quantity: quantity / 1000 });
    remaining -= quantity;
  }
  return allocations;
}
