-- AlterTable
ALTER TABLE `businesses` ADD COLUMN `subscriptionExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `subscriptionStartedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `businesses_verificationStatus_subscriptionExpiresAt_deletedA_idx`
ON `businesses`(`verificationStatus`, `subscriptionExpiresAt`, `deletedAt`);