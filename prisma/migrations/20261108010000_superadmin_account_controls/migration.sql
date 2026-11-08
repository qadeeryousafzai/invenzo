-- AlterTable
ALTER TABLE `businesses` ADD COLUMN `accessPausedAt` DATETIME(3) NULL,
    ADD COLUMN `accessPausedReason` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `users_deletedAt_disabledAt_idx` ON `users`(`deletedAt`, `disabledAt`);