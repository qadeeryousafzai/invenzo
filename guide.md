# Invenzo development guide

This file records each implementation change and how to use or verify it. It is updated throughout development.

## Phase 1 — Foundation (current)

For step-by-step MySQL and shadow database configuration, see [database-setup.md](database-setup.md).

### 1. Workspace and application foundation
- Inspected the workspace: it contained only the supplied logo assets, so no existing application code was replaced.
- Initialized a Next.js App Router application with strict TypeScript, Tailwind CSS, and ESLint in the workspace root.
- Added the Phase 1 dependencies for Auth.js, Prisma, Zod, React Hook Form, icons, and notifications.
- The supplied logo files remain in `logoi/`.

### 2. Database and tenant model
- Added a MySQL 8 Prisma schema with users, credentials, verification/reset tokens, businesses, memberships/invitations, per-business roles and permissions, branches, warehouses, and audit events.
- Tenant records are keyed by `businessId`; membership uniqueness and tenant-scoped branch/role/warehouse codes are enforced in the database.
- Active tenant selection only chooses from the signed-in user’s active memberships. APIs independently enforce tenant scope and server-side permissions.
- Monetary/inventory modules are deferred to Phase 2+; this phase does not present them as complete.

### 3. Configuration
- `.env.local` now contains a cryptographically generated local Auth.js secret and localhost URLs. It is ignored by git. Replace the secret with a deployment-managed value in production.
- Set `DATABASE_URL` to a dedicated, empty MySQL 8 development database; never use another application's populated database for initial setup.
- If the provider blocks database creation during `migrate dev`, configure `SHADOW_DATABASE_URL` with a separate empty disposable MySQL database. It must not be the same as the primary database.
- Configure `RESEND_API_KEY` and a verified `EMAIL_FROM` to deliver verification/reset emails. Registration remains gated on sending verification mail.
- Set `SUPER_ADMIN_EMAIL` and a unique `SUPER_ADMIN_PASSWORD` (minimum 12 characters) before seeding to create the platform admin account.
- Never commit `.env` or real credentials.
- The included in-process rate limiter is suitable for local/single-instance development only. Replace it with a shared Redis-backed limiter before horizontal scaling.

### 4. Database setup
- Allow the required Prisma/esbuild build scripts; `pnpm-workspace.yaml` already records the approved packages.
- Create the MySQL database, then run `pnpm exec prisma generate` and `pnpm exec prisma migrate dev --name foundation` (or the matching npm scripts).
- Set the super-admin email/password in local `.env` or `.env.local`, then run `pnpm db:seed` (or `npm run db:seed`). The seed reads the recommended `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` names and the existing lowercase `superadmin_email`/`superadmin_password` aliases. It creates or synchronizes a verified admin login, including the configured password; each explicit seed run resets that account's password to the configured value.
- Run `pnpm dev` (or `npm run dev`) to start at http://localhost:3000.
- Schema validation and client generation work without connecting to MySQL; applying migrations, registration, and DB-backed login require your own configured database.

### Main site links
- [Public homepage](http://localhost:3000/)
- [Product marketplace](http://localhost:3000/marketplace) — searches verified businesses with published, in-date stock.
- [Create a business workspace](http://localhost:3000/register)
- [Sign in](http://localhost:3000/login)
- [Forgot password](http://localhost:3000/forgot-password)
- [Email verification](http://localhost:3000/verify-email) — opened from the verification email.
- [Password reset](http://localhost:3000/reset-password) — opened from the reset email.
- [Accept an employee invitation](http://localhost:3000/invite/accept) — opened from the invitation email.
- [Workspace overview](http://localhost:3000/dashboard) — requires an authenticated business member.
- [Branches and warehouses](http://localhost:3000/dashboard/branches)
- [Team and roles](http://localhost:3000/dashboard/employees)
- [Business profile](http://localhost:3000/dashboard/business)
- [Product catalog](http://localhost:3000/dashboard/products) — requires product creation and inventory-adjust permissions.
- [Personal settings](http://localhost:3000/dashboard/settings)
- [Super-admin console](http://localhost:3000/super-admin) — requires a seeded super-admin account.

The Phase 1 super-admin console supports platform summaries and business verification only. Subscription controls, user/platform management, tickets, announcements, and other administrative modules remain planned; no placeholder controls are presented as functional.

### 5. Implemented flows
- Owner registration creates the account, private business, default permission roles, first branch, and main warehouse in one transaction. Email verification must be sent before sign-in is allowed.
- Credentials login, logout, forgot/reset password, email verification, and password change are implemented. Password resets increment a token version to invalidate existing sessions.
- Team management includes per-tenant roles, permission assignment, email invites, and invite acceptance for existing accounts or new employees.
- Workspace switching stores only an HttpOnly identifier; the server resolves it against the current user's active memberships on every request.
- Branch listing, creation, updates, manager assignment, coordinates, inactive state, and soft archival are implemented. Branch writes require server-checked `branches.manage` permission and same-origin requests.
- The business owner can edit business profile, tax, currency, timezone, and contact settings. Profile and password settings are available to each user.
- The super-admin dashboard uses real database counts and business summaries, with a restricted verification workflow. It does not expose private business activity.
- The initial marketing page, responsive workspace/admin shells, loading/error states, persisted light/dark theme, and toast notifications are implemented.
- Product discovery is a working Phase 2/marketplace slice: workspace product/listing/opening-batch creation is tenant-scoped; the public search uses active branches, verified businesses, available unexpired batches, optional coordinates, and distance sorting. Public search shows only data stored by business owners—there are no demo listings.
- Login, workspace registration, verification, forgot-password, and reset-password flows now show toast feedback as well as accessible inline messages. API handlers return structured errors; database/service failures are distinguished from invalid credentials.

### 6. Changes and verification log
- 2026-11-02: inspected empty application workspace and preserved the four existing logo assets.
- 2026-11-02: scaffolded Next.js, enabled strict TypeScript, installed Phase 1 dependencies, and created the initial tenant/auth/branch Prisma schema.
- 2026-11-02: added Auth.js credentials login, password hashing, verification/reset token flows, invitation onboarding, tenant-scoped RBAC APIs, and platform-admin verification.
- 2026-11-02: built public landing, registration/auth forms, responsive workspace dashboards, profile/team/branch screens, dark theme, error/loading states, and this setup guide.
- 2026-11-02: added custom permission-role creation, employee invitation and account onboarding, member access suspension, branch coordinate inputs, and a shadcn-compatible component setup.
- 2026-11-02: fixed pnpm startup by explicitly approving the required Prisma/esbuild build scripts, generated Prisma Client, and added a git-ignored local Auth.js secret. `pnpm dev` now serves the home and login pages successfully.
- 2026-11-02: updated Prisma config and the admin seed to load `.env.local` and recognize the configured lowercase super-admin variable names. Verified the values are available without printing them; account creation is still blocked because no `DATABASE_URL` or local MySQL server is configured.
- 2026-11-02: fixed stale super-admin credentials: reseeding now synchronizes the configured password and verified-email status for an existing admin account. The sign-in error persists until MySQL is configured, the foundation migration is applied, and the seed completes.
- 2026-11-02: checked the newly configured remote database read-only. It contains existing tables and migration history but none of Invenzo's Phase 1 tables. `migrate dev` was blocked because its user cannot create a shadow database; no schema changes or seed writes were made. Added `SHADOW_DATABASE_URL` support, but setup must use a dedicated empty Invenzo database before migration/seed.
- 2026-11-02: sign-in now reports authentication-service/database failures separately from invalid credentials. A dedicated empty primary database and a separate shadow database are still required before the configured super-admin can be seeded.
- 2026-11-02: added a nearby-product marketplace search and tenant-scoped product listing/opening-stock flow, plus auth/signup/reset toasts. Prisma client/schema generation and local compile checks do not apply the schema to the remote database.
- The marketplace page loads, but search and product management return an explicit setup-needed response until the Product/ProductListing/InventoryBatch migration is safely applied to a dedicated Invenzo database.
- 2026-11-02: documented the primary public, workspace, and super-admin URLs and the super-admin database bootstrap steps.
- 2026-11-02: production build passed; strict TypeScript, ESLint, and two tenant-membership isolation tests passed. Production smoke checks returned `401` for anonymous private branch reads and `403` for a cross-origin branch mutation.
- The current Prisma 6 CLI has a high-severity advisory in its transitive configuration/merge tooling dependency. The fix suggested by npm requires a breaking Prisma 7 upgrade, so it was not forced mid-phase; review and upgrade Prisma tooling before production deployment.
- A real MySQL migration, super-admin account creation, and authenticated end-to-end tenant tests remain blocked: this machine has no local MySQL server and no database/email credentials are configured. Fill them locally before running the migration and seed commands.

## Phase 1 scope boundary
Authentication, business setup, tenant isolation, RBAC, branches, product listing with expiry-aware stock, product discovery, and the real-data initial workspace dashboard are implemented. FEFO sales deduction, purchases, accounting, marketplace checkout, billing, and payment integrations remain later work.
