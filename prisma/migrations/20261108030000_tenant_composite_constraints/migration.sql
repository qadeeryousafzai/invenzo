-- Enforce tenant ownership for role and branch references at the database layer.
ALTER TABLE `roles`
    ADD UNIQUE INDEX `roles_id_businessId_key` (`id`, `businessId`);

ALTER TABLE `memberships`
    DROP FOREIGN KEY `memberships_roleId_fkey`,
    ADD CONSTRAINT `memberships_roleId_businessId_fkey`
        FOREIGN KEY (`roleId`, `businessId`) REFERENCES `roles` (`id`, `businessId`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `membership_invites`
    DROP FOREIGN KEY `membership_invites_roleId_fkey`,
    ADD CONSTRAINT `membership_invites_roleId_businessId_fkey`
        FOREIGN KEY (`roleId`, `businessId`) REFERENCES `roles` (`id`, `businessId`)
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `warehouses`
    DROP FOREIGN KEY `warehouses_branchId_fkey`,
    ADD CONSTRAINT `warehouses_branchId_businessId_fkey`
        FOREIGN KEY (`branchId`, `businessId`) REFERENCES `branches` (`id`, `businessId`)
        ON DELETE CASCADE ON UPDATE CASCADE;
