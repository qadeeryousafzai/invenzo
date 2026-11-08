-- Add an explicit, durable state machine for workspace account access.
ALTER TABLE `businesses`
    ADD COLUMN `accountStatus` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TEMPORARILY_BLOCKED', 'EXPIRED', 'DELETED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    ADD COLUMN `statusReason` VARCHAR(500) NULL,
    ADD COLUMN `statusUntil` DATETIME(3) NULL,
    ADD COLUMN `approvedById` VARCHAR(191) NULL,
    ADD COLUMN `rejectionReason` VARCHAR(1000) NULL,
    ADD COLUMN `statusBeforeDeletion` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TEMPORARILY_BLOCKED', 'EXPIRED', 'DELETED') NULL,
    ADD COLUMN `statusChangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

UPDATE `businesses`
SET `accountStatus` = CASE
        WHEN `deletedAt` IS NOT NULL THEN 'DELETED'
        WHEN `accessPausedAt` IS NOT NULL THEN 'SUSPENDED'
        WHEN `verificationStatus` = 'REJECTED' THEN 'REJECTED'
        WHEN `verificationStatus` = 'PENDING' OR `subscriptionExpiresAt` IS NULL THEN 'PENDING_APPROVAL'
        WHEN `subscriptionExpiresAt` <= CURRENT_TIMESTAMP(3) THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END,
    `statusBeforeDeletion` = CASE
        WHEN `deletedAt` IS NULL THEN NULL
        WHEN `accessPausedAt` IS NOT NULL THEN 'SUSPENDED'
        WHEN `verificationStatus` = 'REJECTED' THEN 'REJECTED'
        WHEN `verificationStatus` = 'PENDING' OR `subscriptionExpiresAt` IS NULL THEN 'PENDING_APPROVAL'
        WHEN `subscriptionExpiresAt` <= CURRENT_TIMESTAMP(3) THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END,
    `statusReason` = `accessPausedReason`,
    `statusChangedAt` = COALESCE(`accessPausedAt`, `updatedAt`, `createdAt`);

DROP INDEX `businesses_type_verificationStatus_deletedAt_idx` ON `businesses`;
DROP INDEX `businesses_verificationStatus_subscriptionExpiresAt_deletedA_idx` ON `businesses`;
ALTER TABLE `businesses`
    DROP COLUMN `verificationStatus`,
    DROP COLUMN `accessPausedAt`,
    DROP COLUMN `accessPausedReason`,
    ADD INDEX `businesses_type_accountStatus_deletedAt_idx` (`type`, `accountStatus`, `deletedAt`),
    ADD INDEX `businesses_accountStatus_subscriptionExpiresAt_deletedAt_idx` (`accountStatus`, `subscriptionExpiresAt`, `deletedAt`),
    ADD INDEX `businesses_statusUntil_accountStatus_idx` (`statusUntil`, `accountStatus`),
    ADD CONSTRAINT `businesses_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `business_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `previousStatus` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TEMPORARILY_BLOCKED', 'EXPIRED', 'DELETED') NULL,
    `newStatus` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TEMPORARILY_BLOCKED', 'EXPIRED', 'DELETED') NOT NULL,
    `reason` VARCHAR(1000) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `business_status_history_businessId_createdAt_idx` (`businessId`, `createdAt`),
    INDEX `business_status_history_actorId_createdAt_idx` (`actorId`, `createdAt`),
    INDEX `business_status_history_newStatus_createdAt_idx` (`newStatus`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `business_status_history_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `business_status_history_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `business_status_history` (`id`, `businessId`, `businessName`, `previousStatus`, `newStatus`, `reason`, `createdAt`)
SELECT REPLACE(UUID(), '-', ''), `id`, `name`, NULL, `accountStatus`, 'Migrated from legacy workspace access fields.', `statusChangedAt`
FROM `businesses`;

CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `businessId` VARCHAR(191) NULL,
    `audience` ENUM('PLATFORM_ADMIN', 'BUSINESS_USER') NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `dedupeKey` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `notifications_dedupeKey_key` (`dedupeKey`),
    INDEX `notifications_audience_userId_readAt_createdAt_idx` (`audience`, `userId`, `readAt`, `createdAt`),
    INDEX `notifications_businessId_createdAt_idx` (`businessId`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `notifications_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `platform_settings` (
    `id` VARCHAR(64) NOT NULL DEFAULT 'default',
    `defaultAccessMonths` INTEGER NOT NULL DEFAULT 1,
    `expiryWarningDays` INTEGER NOT NULL DEFAULT 7,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `platform_settings` (`id`, `defaultAccessMonths`, `expiryWarningDays`)
VALUES ('default', 1, 7);
