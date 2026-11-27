-- CreateTable
CREATE TABLE `pending_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `form` JSON NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'PKR',
    `tracker` VARCHAR(191) NULL,
    `businessId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `pending_registrations_tracker_key`(`tracker`),
    INDEX `pending_registrations_status_idx`(`status`),
    INDEX `pending_registrations_tracker_idx`(`tracker`),
    INDEX `pending_registrations_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_events` (
    `id` VARCHAR(191) NOT NULL,
    `eventToken` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `payment_events_eventToken_key`(`eventToken`),
    INDEX `payment_events_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `businesses` ADD COLUMN `plan` VARCHAR(16) NULL;
