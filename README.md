# Invenzo

Multi-tenant inventory and product-discovery SaaS with business registration, platform account lifecycle controls, tenant-scoped RBAC, inventory operations, and business reporting.

## Requirements
- Node.js 20.19+ (Node.js 24 LTS recommended)
- MySQL 8
- pnpm (recommended) or npm
- A Resend account/API key and verified sender for verification and password-reset emails

## Local setup
1. Copy `.env.example` to `.env` (or `.env.local`) and configure either `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for a dedicated MySQL 8 database. Do not point setup migrations at another application's database.
2. If the MySQL provider denies `CREATE DATABASE`, provision a second empty disposable database and set `SHADOW_DATABASE_URL` to it. Keep it separate from the primary database.
3. Set `RESEND_API_KEY` and a verified `EMAIL_FROM` for verification and password-reset emails.
4. Set `SUPER_ADMIN_EMAIL` and a strong unique `SUPER_ADMIN_PASSWORD` (12+ characters) to create the platform administrator.
5. Install dependencies with `pnpm install` (or `npm install`). The workspace config permits only Prisma/esbuild's required build scripts.
6. Generate Prisma Client with `pnpm exec prisma generate` (or `npm run db:generate`).
7. Apply the committed migrations with `pnpm db:deploy` to a dedicated, empty MySQL database. Do not run these migrations against another application's database.
8. Seed the super-admin with `pnpm db:seed` (or `npm run db:seed`). The configured account is email-verified and can sign in at the admin link below.
9. Run `pnpm dev` (or `npm run dev`) and open http://localhost:3000.

For local development, `.env.local` contains a randomly generated, git-ignored Auth.js secret. Set a production secret through your deployment secret manager; do not commit secrets.

For detailed hosted MySQL 8 setup, shadow-database permissions, migration, and super-admin seeding, see [database-setup.md](database-setup.md).

For deployment to Hostinger Node.js hosting with Hostinger MySQL, see [hostinger-deployment.md](hostinger-deployment.md). Invenzo is also installable as a web app on supported mobile and desktop browsers.

## Main site links
- Homepage: http://localhost:3000/
- Nearby product marketplace: http://localhost:3000/marketplace
- Business registration: http://localhost:3000/register
- Sign in: http://localhost:3000/login
- Forgot password: http://localhost:3000/forgot-password
- Email verification: http://localhost:3000/verify-email (email link)
- Password reset: http://localhost:3000/reset-password (email link)
- Employee invitation: http://localhost:3000/invite/accept (email link)
- Workspace dashboard: http://localhost:3000/dashboard
- Branches: http://localhost:3000/dashboard/branches
- Team and roles: http://localhost:3000/dashboard/employees
- Business profile: http://localhost:3000/dashboard/business
- Product catalog and opening stock: http://localhost:3000/dashboard/products
- Categories: http://localhost:3000/dashboard/categories
- Inventory and stock movement history: http://localhost:3000/dashboard/inventory
- Purchases: http://localhost:3000/dashboard/purchases
- Sales: http://localhost:3000/dashboard/sales
- Customers and suppliers: http://localhost:3000/dashboard/customers and `/dashboard/suppliers`
- Expenses and reports: http://localhost:3000/dashboard/expenses and `/dashboard/reports`
- Business notifications: http://localhost:3000/dashboard/notifications
- Personal settings: http://localhost:3000/dashboard/settings
- Super-admin console: http://localhost:3000/super-admin (requires the seeded account)

The super-admin console reviews registrations and manages the full account lifecycle, including approval, rejection, suspension, timed restriction, restoration, expiry extension, and soft deletion. Admins can review account history, audit activity, notifications, and configurable expiry defaults. Business workspaces include categories, inventory movements, customers, suppliers, purchases, sales, employees through the existing membership/role system, expenses, and reports. Sales and stock changes use tenant-scoped transactions; sales allocate unexpired stock by earliest expiry date.

## Useful scripts
- `npm run dev` — local Next.js development server.
- `npm run lint` — ESLint.
- `npm run typecheck` — TypeScript check without emitting files.
- `npm test` — automated unit tests.
- `pnpm test:integration` — database lifecycle, tenant foreign-key, scheduler, and data-retention checks. Set `TEST_DATABASE_URL` to a dedicated database whose name includes `test`; apply the committed migrations to that disposable database first. The test deletes only its uniquely named fixture businesses.
- `npm run build` — production build.
- `npm run db:generate` — Prisma Client generation.
- `npm run db:migrate` — apply a development migration (Prisma prompts for the migration name if needed).
- `npm run db:deploy` — apply committed migrations to the production database.
- `npm run db:seed` — bootstrap an explicitly configured platform admin.
- `pnpm dev` — start the development server (recommended).
- `pnpm db:seed` — bootstrap the configured super-admin account.

## Security and operations
- Tenant access must be resolved from the authenticated user and verified active membership; never trust a client-supplied business ID on its own.
- Use HTTPS and secure production cookie settings behind a trusted proxy. Store secrets in a managed secret store.
- Configure recurring encrypted MySQL backups and regularly test restoration. Keep backups access-controlled and retention-limited.
- Avoid using `prisma migrate dev` against production; deploy reviewed migrations with `prisma migrate deploy`.
- Configure the daily account-maintenance cron call documented in [hostinger-deployment.md](hostinger-deployment.md) so expiry state, timed restrictions, and advance notices are processed.
- See [guide.md](guide.md) for the change-by-change implementation guide and phase boundary.
# invenzo
# invenzo
