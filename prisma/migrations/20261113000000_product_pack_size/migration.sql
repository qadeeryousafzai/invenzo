-- Pack sizes: allow a product to be stocked in base units (tablets) but sold by pack (box of 10).
-- MariaDB does not support inline ADD CONSTRAINT, so the columns are added with separate statements.

ALTER TABLE `products`
  ADD COLUMN `packSize` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `products`
  ADD COLUMN `packUnit` VARCHAR(32) NULL;
