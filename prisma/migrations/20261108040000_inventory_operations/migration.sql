-- AlterTable
ALTER TABLE `products` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `categories_businessId_deletedAt_name_idx`(`businessId`, `deletedAt`, `name`),
    UNIQUE INDEX `categories_businessId_name_key`(`businessId`, `name`),
    UNIQUE INDEX `categories_id_businessId_key`(`id`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `productListingId` VARCHAR(191) NOT NULL,
    `inventoryBatchId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `type` ENUM('OPENING', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN') NOT NULL,
    `quantityChange` DECIMAL(14, 3) NOT NULL,
    `unitCost` DECIMAL(12, 2) NULL,
    `reference` VARCHAR(191) NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_businessId_createdAt_idx`(`businessId`, `createdAt`),
    INDEX `stock_movements_productListingId_createdAt_idx`(`productListingId`, `createdAt`),
    INDEX `stock_movements_businessId_type_createdAt_idx`(`businessId`, `type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `customers_businessId_name_deletedAt_idx`(`businessId`, `name`, `deletedAt`),
    INDEX `customers_businessId_email_idx`(`businessId`, `email`),
    UNIQUE INDEX `customers_id_businessId_key`(`id`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `suppliers_businessId_name_deletedAt_idx`(`businessId`, `name`, `deletedAt`),
    INDEX `suppliers_businessId_email_idx`(`businessId`, `email`),
    UNIQUE INDEX `suppliers_id_businessId_key`(`id`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `reference` VARCHAR(64) NOT NULL,
    `notes` VARCHAR(1000) NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `purchases_businessId_purchasedAt_idx`(`businessId`, `purchasedAt`),
    INDEX `purchases_businessId_supplierId_purchasedAt_idx`(`businessId`, `supplierId`, `purchasedAt`),
    UNIQUE INDEX `purchases_businessId_reference_key`(`businessId`, `reference`),
    UNIQUE INDEX `purchases_id_businessId_key`(`id`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `productListingId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,
    `unitCost` DECIMAL(12, 2) NOT NULL,
    `lineTotal` DECIMAL(14, 2) NOT NULL,
    `batchNumber` VARCHAR(64) NOT NULL,
    `expiryDate` DATETIME(3) NULL,

    INDEX `purchase_items_businessId_purchaseId_idx`(`businessId`, `purchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `reference` VARCHAR(64) NOT NULL,
    `notes` VARCHAR(1000) NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `soldAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sales_businessId_soldAt_idx`(`businessId`, `soldAt`),
    INDEX `sales_businessId_customerId_soldAt_idx`(`businessId`, `customerId`, `soldAt`),
    UNIQUE INDEX `sales_businessId_reference_key`(`businessId`, `reference`),
    UNIQUE INDEX `sales_id_businessId_key`(`id`, `businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `productListingId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `lineTotal` DECIMAL(14, 2) NOT NULL,

    INDEX `sale_items_businessId_saleId_idx`(`businessId`, `saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `notes` VARCHAR(1000) NULL,
    `incurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_businessId_incurredAt_idx`(`businessId`, `incurredAt`),
    INDEX `expenses_businessId_category_incurredAt_idx`(`businessId`, `category`, `incurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_businessId_categoryId_deletedAt_idx` ON `products`(`businessId`, `categoryId`, `deletedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `inventory_batches_id_businessId_key` ON `inventory_batches`(`id`, `businessId`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_businessId_fkey` FOREIGN KEY (`categoryId`, `businessId`) REFERENCES `categories`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_productListingId_businessId_fkey` FOREIGN KEY (`productListingId`, `businessId`) REFERENCES `product_listings`(`id`, `businessId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_inventoryBatchId_businessId_fkey` FOREIGN KEY (`inventoryBatchId`, `businessId`) REFERENCES `inventory_batches`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_branchId_businessId_fkey` FOREIGN KEY (`branchId`, `businessId`) REFERENCES `branches`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_businessId_fkey` FOREIGN KEY (`supplierId`, `businessId`) REFERENCES `suppliers`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchaseId_businessId_fkey` FOREIGN KEY (`purchaseId`, `businessId`) REFERENCES `purchases`(`id`, `businessId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_productListingId_businessId_fkey` FOREIGN KEY (`productListingId`, `businessId`) REFERENCES `product_listings`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_branchId_businessId_fkey` FOREIGN KEY (`branchId`, `businessId`) REFERENCES `branches`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customerId_businessId_fkey` FOREIGN KEY (`customerId`, `businessId`) REFERENCES `customers`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_saleId_businessId_fkey` FOREIGN KEY (`saleId`, `businessId`) REFERENCES `sales`(`id`, `businessId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_productListingId_businessId_fkey` FOREIGN KEY (`productListingId`, `businessId`) REFERENCES `product_listings`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create the new inventory and operations permissions and grant them to existing system roles.
INSERT IGNORE INTO `permissions` (`key`, `description`) VALUES
    ('categories.manage', 'Manage product categories'),
    ('customers.manage', 'Manage customers'),
    ('suppliers.manage', 'Manage suppliers'),
    ('expenses.manage', 'Manage expenses');

INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionKey`)
SELECT `id`, 'categories.manage' FROM `roles` WHERE `key` IN ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER');
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionKey`)
SELECT `id`, 'customers.manage' FROM `roles` WHERE `key` IN ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'SALESPERSON');
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionKey`)
SELECT `id`, 'suppliers.manage' FROM `roles` WHERE `key` IN ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER');
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionKey`)
SELECT `id`, 'expenses.manage' FROM `roles` WHERE `key` IN ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT');

