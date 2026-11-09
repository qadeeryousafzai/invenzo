import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
let isIsolatedTestDatabase = false;
if (testDatabaseUrl) {
  let databaseName = "";
  try { databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.split("/").at(-1) ?? ""); } catch { /* fail closed below */ }
  isIsolatedTestDatabase = /(?:^|[_-])test(?:$|[_-])/i.test(databaseName);
}

test("tenant foreign keys, scheduled lifecycle changes, and soft deletion preserve business data", { skip: !isIsolatedTestDatabase }, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.CRON_SECRET = `integration-${randomUUID()}`;
  const [{ prisma }, { POST: runMaintenance }] = await Promise.all([
    import("../../src/lib/prisma.ts"),
    import("../../src/app/api/cron/business-account-maintenance/route.ts"),
  ]);
  const businessIds = [];
  const suffix = randomUUID().replaceAll("-", "");
  const now = new Date();
  try {
    await prisma.$connect();
    const expired = await prisma.business.create({ data: { name: `Integration Expired ${suffix}`, slug: `test-expired-${suffix}`, accountStatus: "ACTIVE", subscriptionStartedAt: new Date(now.getTime() - 90 * 86400000), subscriptionExpiresAt: new Date(now.getTime() - 1000) } });
    businessIds.push(expired.id);
    const temporary = await prisma.business.create({ data: { name: `Integration Temporary ${suffix}`, slug: `test-temporary-${suffix}`, accountStatus: "TEMPORARILY_BLOCKED", statusUntil: new Date(now.getTime() - 1000), subscriptionStartedAt: now, subscriptionExpiresAt: new Date(now.getTime() + 30 * 86400000) } });
    businessIds.push(temporary.id);
    const [branchA, branchB] = await Promise.all([
      prisma.branch.create({ data: { businessId: expired.id, name: "Test branch A", code: `A${suffix.slice(0, 10)}` } }),
      prisma.branch.create({ data: { businessId: temporary.id, name: "Test branch B", code: `B${suffix.slice(0, 10)}` } }),
    ]);
    const [categoryA, categoryB] = await Promise.all([
      prisma.category.create({ data: { businessId: expired.id, name: `Category A ${suffix}` } }),
      prisma.category.create({ data: { businessId: temporary.id, name: `Category B ${suffix}` } }),
    ]);
    const productA = await prisma.product.create({ data: { businessId: expired.id, name: "Integration product", sku: suffix.slice(0, 30), categoryId: categoryA.id } });
    const listingA = await prisma.productListing.create({ data: { businessId: expired.id, productId: productA.id, branchId: branchA.id, price: "4.50" } });
    const batch = await prisma.inventoryBatch.create({ data: { businessId: expired.id, productListingId: listingA.id, batchNumber: suffix.slice(0, 32), quantityRemaining: "8.000" } });
    await prisma.stockMovement.create({ data: { businessId: expired.id, productListingId: listingA.id, inventoryBatchId: batch.id, type: "OPENING", quantityChange: "8.000", note: "Integration test opening stock" } });
    const customer = await prisma.customer.create({ data: { businessId: expired.id, name: "Integration customer" } });
    const supplier = await prisma.supplier.create({ data: { businessId: expired.id, name: "Integration supplier" } });
    const purchase = await prisma.purchase.create({ data: { businessId: expired.id, branchId: branchA.id, supplierId: supplier.id, reference: `PO-${suffix.slice(0, 24)}`, total: "8.00" } });
    await prisma.purchaseItem.create({ data: { businessId: expired.id, purchaseId: purchase.id, productListingId: listingA.id, quantity: "2.000", unitCost: "4.00", lineTotal: "8.00", batchNumber: `P-${suffix.slice(0, 24)}` } });
    const saleA = await prisma.sale.create({ data: { businessId: expired.id, branchId: branchA.id, customerId: customer.id, reference: `SA-${suffix.slice(0, 24)}`, total: "4.50" } });
    await prisma.saleItem.create({ data: { businessId: expired.id, saleId: saleA.id, productListingId: listingA.id, quantity: "1.000", unitPrice: "4.50", lineTotal: "4.50" } });
    await prisma.expense.create({ data: { businessId: expired.id, title: "Integration expense", category: "Operations", amount: "2.00" } });
    const saleB = await prisma.sale.create({ data: { businessId: temporary.id, branchId: branchB.id, reference: `SB-${suffix.slice(0, 24)}`, total: "0.00" } });

    await assert.rejects(() => prisma.product.create({ data: { businessId: expired.id, name: "Cross tenant category", sku: `X${suffix.slice(0, 28)}`, categoryId: categoryB.id } }), (error) => error?.code === "P2003");
    await assert.rejects(() => prisma.saleItem.create({ data: { businessId: temporary.id, saleId: saleB.id, productListingId: listingA.id, quantity: "1.000", unitPrice: "4.50", lineTotal: "4.50" } }), (error) => error?.code === "P2003");

    const response = await runMaintenance(new Request("http://localhost/api/cron/business-account-maintenance", { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }));
    const maintenance = await response.json();
    assert.equal(response.status, 200, JSON.stringify(maintenance));
    assert.equal(maintenance.data.expired, 1);
    assert.equal(maintenance.data.unblocked, 1);
    assert.equal((await prisma.business.findUnique({ where: { id: expired.id }, select: { accountStatus: true } }))?.accountStatus, "EXPIRED");
    assert.equal((await prisma.business.findUnique({ where: { id: temporary.id }, select: { accountStatus: true } }))?.accountStatus, "ACTIVE");
    assert.equal(await prisma.businessStatusHistory.count({ where: { businessId: expired.id, newStatus: "EXPIRED" } }), 1);

    await prisma.business.update({ where: { id: expired.id }, data: { accountStatus: "DELETED", statusBeforeDeletion: "EXPIRED", deletedAt: new Date() } });
    const preserved = await Promise.all([
      prisma.product.count({ where: { businessId: expired.id } }), prisma.inventoryBatch.count({ where: { businessId: expired.id } }),
      prisma.customer.count({ where: { businessId: expired.id } }), prisma.supplier.count({ where: { businessId: expired.id } }),
      prisma.purchase.count({ where: { businessId: expired.id } }), prisma.sale.count({ where: { businessId: expired.id } }),
      prisma.expense.count({ where: { businessId: expired.id } }), prisma.stockMovement.count({ where: { businessId: expired.id } }),
    ]);
    assert.deepEqual(preserved, [1, 1, 1, 1, 1, 1, 1, 1]);
  } finally {
    if (businessIds.length) await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await prisma.$disconnect();
  }
});
