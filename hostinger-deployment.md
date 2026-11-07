# Deploy Invenzo to Hostinger

Invenzo uses a Node.js server and MySQL, so deploy it as a **Node.js web application** and use a **Hostinger MySQL database**. Do not upload it as a static website: authentication, API routes, and Prisma require a running Node.js server.

## 1. Confirm the hosting plan

In hPanel, confirm that the plan provides Node.js application hosting (or use a Hostinger VPS). The application needs Node.js 20.19 or newer, persistent application hosting, HTTPS, and a way to set environment variables and run deployment commands. If your plan does not provide a Node.js app runtime, use a VPS or upgrade; a static hosting slot cannot run this app.

## 2. Create the production MySQL database

In hPanel, create a dedicated, empty MySQL database and user for Invenzo. Grant the user the permissions needed to create and modify tables. Copy the exact database host, port, database name, username, and password displayed by Hostinger. Use the host provided for the application; do not assume it is `localhost`.

Create a connection string in this format, replacing the placeholders with Hostinger's values:

```dotenv
DATABASE_URL="mysql://USERNAME:PERCENT_ENCODED_PASSWORD@HOST:PORT/DATABASE_NAME"
```

Percent-encode reserved characters in the password before putting it in the URL. Never share or commit this connection string. A production database does not need a Prisma shadow database; do not set `SHADOW_DATABASE_URL` on production.

For the current Hostinger setup, the database name and username are `u514608833_invenzoapp`, and the reported MySQL host is `srv915.hstgr.io` (confirm the port and exact hostname in hPanel). The configured site origin is `https://invenzoapp.com`. The database password is intentionally not documented here; add it only in the ignored local `.env` file and Hostinger's private environment settings.

## 3. Prepare the migration history before production

The initial Prisma schema migration is now included under `prisma/migrations/`. It creates the application tables from `prisma/schema.prisma` and does not seed data.

If development migrations cannot be created because the MySQL provider restricts shadow databases, follow the separate-database guidance in [database-setup.md](database-setup.md). Never use a populated or production database as a shadow database.

## 4. Connect the application source

Connect the repository through Hostinger's Git deployment or upload it to the Node.js app root. Configure the repository root as the working directory, choose Node.js 20.19 or newer, and install dependencies with `pnpm install --frozen-lockfile` (or `npm ci` if the Hostinger runtime is configured for npm).

## 5. Add production environment variables in hPanel

Set these in the Node.js application environment settings **before building**, not in Git or a publicly served file:

- `DATABASE_URL` — Hostinger production MySQL connection string
- `AUTH_SECRET` — a newly generated, strong production secret
- `AUTH_URL` — the canonical HTTPS origin, for example `https://inventory.example.com`
- `AUTH_TRUST_HOST=true` — required when Auth.js runs behind Hostinger's reverse proxy
- `APP_URL` — the same canonical HTTPS origin, used for email links
- `RESEND_API_KEY` and `EMAIL_FROM` — for verification and password-reset email
- `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` — optional values if bootstrapping the platform administrator with the seed
- `NODE_ENV=production` — if not set automatically by the hosting runtime

Keep these values server-side; never prefix secrets with `NEXT_PUBLIC_`. Use the real deployed domain rather than the sample domain above.

## 6. Build, migrate, and initialize the administrator

Build and start the application using Hostinger's Node.js app settings:

- **Build:** `pnpm hostinger:build` (or `npm run hostinger:build`). This generates Prisma Client and builds Next.js. The Prisma config requires `DATABASE_URL` to be available during the build.
- **Start:** `pnpm start` (or `npm start`). Keep it running as a Node.js service and point the domain to the app through hPanel.
- Enable HTTPS before allowing users to sign in or install the web app.

Before applying the first migration, confirm in hPanel that the selected database is empty. If it already contains Invenzo tables/data, stop and baseline/reconcile it rather than running the initial migration over existing tables. On a new empty database, connect to the app using Hostinger's terminal/SSH and run:

```sh
pnpm db:deploy
```

This applies committed migrations without creating or dropping a shadow database. Run it on each release that adds a reviewed migration, before switching traffic to code that depends on the new schema.

If configured, bootstrap the administrator once with `pnpm db:seed`. The seed sets the admin password to the configured value each time it runs; keep that value private and rotate it securely. Do not run development seed data on production unless you have reviewed what the seed does.

## 7. Verify and operate

- Open the HTTPS domain and verify registration, sign-in, email verification, and password-reset links.
- Confirm the app can reach the Hostinger MySQL host and that tables are present after migration.
- Configure encrypted database backups in hPanel and periodically test a restore.
- Keep production and development databases separate. Apply production schema changes with `pnpm db:deploy`, never `prisma migrate dev`.
- The current in-process rate limiter is intended for a single app instance. Configure a shared Redis-backed limiter before scaling across multiple instances.

## Install on mobile or desktop

Invenzo includes a web app manifest and install action. On supported browsers, open the site over HTTPS and select **Install app**. On iPhone/iPad Safari, use **Share → Add to Home Screen**. The installed app uses the same Hostinger-hosted site and receives updates when it is redeployed; it is not a separate native App Store download.






