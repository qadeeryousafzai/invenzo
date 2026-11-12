-- Global Medicine Catalog
-- Additive, forward-only migration. Safe to apply to an existing production
-- database: creates new tables and adds one nullable column to `products`.
--
-- MariaDB (used by the Hostinger deployment) does not accept `ADD CONSTRAINT`
-- inside `CREATE TABLE`, so every foreign key is applied with a separate
-- `ALTER TABLE` statement after the tables exist.


CREATE TABLE `medicine_sources` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `countryCode` CHAR(2) NULL,
  `countryName` VARCHAR(120) NULL,
  `homepageUrl` VARCHAR(500) NULL,
  `datasetUrl` VARCHAR(1000) NULL,
  `licenseName` VARCHAR(191) NULL,
  `licenseUrl` VARCHAR(1000) NULL,
  `attributionRequired` BOOLEAN NOT NULL DEFAULT false,
  `redistributionAllowed` BOOLEAN NOT NULL DEFAULT false,
  `commercialUseAllowed` BOOLEAN NOT NULL DEFAULT false,
  `termsReviewedAt` DATETIME(3) NULL,
  `adapterKey` VARCHAR(64) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `medicine_sources_key_key`(`key`),
  INDEX `medicine_sources_countryCode_idx`(`countryCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_categories` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `parentId` VARCHAR(191) NULL,
  `description` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `medicine_categories_key_key`(`key`),
  INDEX `medicine_categories_parentId_idx`(`parentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_manufacturers` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `countryCode` CHAR(2) NULL,
  `sourceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `medicine_manufacturers_key_key`(`key`),
  INDEX `medicine_manufacturers_name_idx`(`name`),
  INDEX `medicine_manufacturers_countryCode_idx`(`countryCode`),
  INDEX `medicine_manufacturers_sourceId_idx`(`sourceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicines` (
  `id` VARCHAR(191) NOT NULL,
  `canonicalKey` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `sourceRecordId` VARCHAR(191) NOT NULL,
  `brandName` VARCHAR(191) NULL,
  `genericName` VARCHAR(191) NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `nameNormalized` VARCHAR(191) NOT NULL,
  `searchText` TEXT NULL,
  `strengthText` VARCHAR(191) NULL,
  `dosageForm` VARCHAR(120) NULL,
  `route` VARCHAR(120) NULL,
  `atcCode` VARCHAR(32) NULL,
  `manufacturerId` VARCHAR(191) NULL,
  `categoryId` VARCHAR(191) NULL,
  `countryCode` CHAR(2) NULL,
  `regulatoryStatus` VARCHAR(64) NULL,
  `isBrand` BOOLEAN NOT NULL DEFAULT false,
  `isGeneric` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `medicines_canonicalKey_key`(`canonicalKey`),
  INDEX `medicines_sourceId_sourceRecordId_idx`(`sourceId`, `sourceRecordId`),
  INDEX `medicines_genericName_idx`(`genericName`),
  INDEX `medicines_brandName_idx`(`brandName`),
  INDEX `medicines_displayName_idx`(`displayName`),
  INDEX `medicines_nameNormalized_idx`(`nameNormalized`),
  INDEX `medicines_strengthText_idx`(`strengthText`),
  INDEX `medicines_dosageForm_idx`(`dosageForm`),
  INDEX `medicines_atcCode_idx`(`atcCode`),
  INDEX `medicines_manufacturerId_idx`(`manufacturerId`),
  INDEX `medicines_categoryId_idx`(`categoryId`),
  INDEX `medicines_countryCode_idx`(`countryCode`),
  INDEX `medicines_isBrand_idx`(`isBrand`),
  INDEX `medicines_isGeneric_idx`(`isGeneric`),
  FULLTEXT INDEX `medicines_searchText_idx`(`searchText`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_ingredients` (
  `id` VARCHAR(191) NOT NULL,
  `medicineId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(64) NULL,
  `strengthText` VARCHAR(191) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medicine_ingredients_medicineId_idx`(`medicineId`),
  INDEX `medicine_ingredients_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_identifiers` (
  `id` VARCHAR(191) NOT NULL,
  `medicineId` VARCHAR(191) NOT NULL,
  `system` VARCHAR(120) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `use` VARCHAR(32) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medicine_identifiers_medicineId_idx`(`medicineId`),
  INDEX `medicine_identifiers_system_value_idx`(`system`, `value`),
  INDEX `medicine_identifiers_value_idx`(`value`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_packages` (
  `id` VARCHAR(191) NOT NULL,
  `medicineId` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `quantityValue` VARCHAR(64) NULL,
  `quantityUnit` VARCHAR(64) NULL,
  `gtin` VARCHAR(64) NULL,
  `regulatoryStatus` VARCHAR(64) NULL,
  `marketingStatus` VARCHAR(64) NULL,
  `sourceRecordId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medicine_packages_medicineId_idx`(`medicineId`),
  INDEX `medicine_packages_gtin_idx`(`gtin`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_source_records` (
  `id` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `sourceRecordId` VARCHAR(191) NOT NULL,
  `medicineId` VARCHAR(191) NULL,
  `countryCode` CHAR(2) NULL,
  `sourceUpdatedAt` DATETIME(3) NULL,
  `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `licenseName` VARCHAR(191) NULL,
  `licenseUrl` VARCHAR(1000) NULL,
  `attributionRequired` BOOLEAN NOT NULL DEFAULT false,
  `redistributionAllowed` BOOLEAN NOT NULL DEFAULT false,
  `commercialUseAllowed` BOOLEAN NOT NULL DEFAULT false,
  `rawKey` VARCHAR(191) NULL,
  `notes` TEXT NULL,

  UNIQUE INDEX `medicine_source_records_sourceId_sourceRecordId_key`(`sourceId`, `sourceRecordId`),
  INDEX `medicine_source_records_medicineId_idx`(`medicineId`),
  INDEX `medicine_source_records_sourceId_idx`(`sourceId`),
  INDEX `medicine_source_records_countryCode_idx`(`countryCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_aliases` (
  `id` VARCHAR(191) NOT NULL,
  `medicineId` VARCHAR(191) NOT NULL,
  `alias` VARCHAR(191) NOT NULL,
  `aliasType` VARCHAR(32) NOT NULL DEFAULT 'OTHER',
  `sourceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medicine_aliases_medicineId_idx`(`medicineId`),
  INDEX `medicine_aliases_alias_idx`(`alias`),
  INDEX `medicine_aliases_aliasType_idx`(`aliasType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_import_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  `datasetUrl` VARCHAR(1000) NULL,
  `datasetLabel` VARCHAR(191) NULL,
  `totalRecords` INTEGER NOT NULL DEFAULT 0,
  `processedRecords` INTEGER NOT NULL DEFAULT 0,
  `importedRecords` INTEGER NOT NULL DEFAULT 0,
  `duplicateRecords` INTEGER NOT NULL DEFAULT 0,
  `failedRecords` INTEGER NOT NULL DEFAULT 0,
  `cursor` TEXT NULL,
  `lastBatchSize` INTEGER NOT NULL DEFAULT 0,
  `errorMessage` TEXT NULL,
  `startedAt` DATETIME(3) NULL,
  `finishedAt` DATETIME(3) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `medicine_import_jobs_sourceId_status_idx`(`sourceId`, `status`),
  INDEX `medicine_import_jobs_status_idx`(`status`),
  INDEX `medicine_import_jobs_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medicine_import_errors` (
  `id` VARCHAR(191) NOT NULL,
  `jobId` VARCHAR(191) NOT NULL,
  `sourceRecordId` VARCHAR(191) NULL,
  `stage` VARCHAR(64) NULL,
  `message` TEXT NOT NULL,
  `details` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `medicine_import_errors_jobId_idx`(`jobId`),
  INDEX `medicine_import_errors_stage_idx`(`stage`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `products`
  ADD COLUMN `catalogMedicineId` VARCHAR(191) NULL;

ALTER TABLE `products`
  ADD INDEX `products_catalogMedicineId_idx`(`catalogMedicineId`);


-- Foreign keys (MariaDB requires these as separate ALTER statements)
ALTER TABLE `medicine_categories` ADD CONSTRAINT `medicine_categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `medicine_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `medicine_manufacturers` ADD CONSTRAINT `medicine_manufacturers_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `medicine_sources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `medicines` ADD CONSTRAINT `medicines_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `medicine_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicines` ADD CONSTRAINT `medicines_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `medicine_manufacturers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `medicines` ADD CONSTRAINT `medicines_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `medicine_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `medicine_ingredients` ADD CONSTRAINT `medicine_ingredients_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_identifiers` ADD CONSTRAINT `medicine_identifiers_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_packages` ADD CONSTRAINT `medicine_packages_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_source_records` ADD CONSTRAINT `medicine_source_records_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `medicine_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_source_records` ADD CONSTRAINT `medicine_source_records_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `medicine_aliases` ADD CONSTRAINT `medicine_aliases_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_import_jobs` ADD CONSTRAINT `medicine_import_jobs_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `medicine_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medicine_import_errors` ADD CONSTRAINT `medicine_import_errors_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `medicine_import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


