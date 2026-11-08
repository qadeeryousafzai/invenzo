# MySQL Database Setup Guide

This guide connects Invenzo to **two dedicated, empty MySQL 8 databases**: the primary application database and Prisma Migrate's disposable shadow database. It intentionally does not reuse the existing configured database because it already contains tables and migration history unrelated to Invenzo.

For a production deployment hosted on Hostinger, follow [hostinger-deployment.md](hostinger-deployment.md). Use a separate production database and do not configure a shadow database there.

## 1. Create the databases in your hosting panel

In your MySQL hosting/control panel:

1. Create a new, empty database for Invenzo's development environment (for example, `invenzo_dev`).
2. Create a second, separate, empty database for Prisma's shadow schema (for example, `invenzo_shadow`).
3. Create or select a MySQL user and grant it full privileges on **both** databases.
4. Copy the provider's host, port, database names, username, and password. Some shared hosts add an account prefix to database and user names; use the exact values shown by the provider.
5. Verify the provider accepts remote MySQL connections from your development machine/IP. Do not enable public access unless your host requires it; use an IP allowlist where available.

**Important:** Do not use the already configured, populated database as either the new Invenzo database or the shadow database. The shadow database must be separate, empty, and disposable. Prisma may drop/recreate its contents during development migrations.

## 2. Configure local environment

Open the ignored `.env.local` file in the project root. Keep the existing super-admin values and Auth.js secret intact. Either set the provider connection string below, or provide the separate `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` values; the app, Prisma config, and seed command build a properly encoded MySQL URL from those variables when `DATABASE_URL` is absent.

```dotenv
DATABASE_URL="mysql://USERNAME:PASSWORD@MYSQL_HOST:3306/INVENZO_DATABASE"
SHADOW_DATABASE_URL="mysql://USERNAME:PASSWORD@MYSQL_HOST:3306/INVENZO_SHADOW_DATABASE"
```

Replace every uppercase placeholder. If the password contains reserved URL characters (such as `@`, `:`, `/`, `?`, `#`, or `%`), percent-encode it before placing it in the URL. Do not use `localhost` unless MySQL is actually running on your own computer.

Keep `.env.local` private and untracked. Never paste connection strings, database passwords, Auth secrets, or admin passwords into chat or commit them to Git. You can check whether values are present without showing them:

```sh
for key in DATABASE_URL SHADOW_DATABASE_URL; do
  if grep -q "^${key}=.*[^=\" ]" .env.local; then echo "$key is set"; else echo "$key is missing"; fi
done
```

## 3. Validate connectivity and prepare Prisma

From the project directory, run:

```sh
pnpm exec prisma validate
pnpm exec prisma generate
```

Then create and apply the initial Invenzo schema:

```sh
pnpm exec prisma migrate dev --name foundation
```

This applies to the primary database and uses the separately configured shadow database for migration drift checks. The command should create a migration under `prisma/migrations/` and create tables such as `users`, `businesses`, `memberships`, `branches`, `products`, `product_listings`, and `inventory_batches`.

### If the command still reports a shadow-database permission error

- Confirm `SHADOW_DATABASE_URL` names the second database, not the primary database.
- Confirm the same MySQL user has create/alter/drop privileges on the shadow database and appropriate schema privileges on the primary database.
- Confirm both database names and prefixes exactly match the host panel.
- Ask the hosting provider whether remote MySQL access is enabled for your IP.
- Do not retry with a populated database and do not point both URLs at the same database.

If the provider will not permit shadow databases, use a local MySQL 8 development instance with two local databases, or have the provider grant a dedicated shadow database. Avoid deploying an unreviewed baseline directly to the existing populated database.

## 4. Create the configured Super Admin

The existing `.env.local` can retain the configured `superadmin_email` and `superadmin_password` values. The seed supports those lowercase names as well as `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.

After the migration succeeds, run:

```sh
pnpm db:seed
```

The seed creates or synchronizes a platform administrator, marks the email verified, and sets the password to the configured value. Running it again **resets that account password to the configured environment value**. Keep the password private.

Sign in at:

- http://localhost:3000/login
- Super Admin console: http://localhost:3000/super-admin

## 5. Start and verify the app

```sh
pnpm dev
```

Open http://localhost:3000. You can use the customer marketplace at http://localhost:3000/marketplace. Product search shows real results only after businesses create products, branch listings, and available inventory batches.

For setup verification, first check the migration state:

```sh
pnpm exec prisma migrate status
```

If sign-in fails after migration and seeding, check the development server output for a database/auth error, confirm `DATABASE_URL` still points at the migrated Invenzo database, and re-run `pnpm db:seed` to sync the configured admin credentials.

## Production notes

- Use separate, production-specific databases and managed secrets; do not copy local `.env.local` to a server.
- Apply reviewed migrations using `prisma migrate deploy` in production, not `migrate dev`.
- Configure encrypted, access-controlled backups and test restores before storing business data.
- The in-process rate limiter is intended for local/single-instance use; configure Redis before horizontal scaling.
