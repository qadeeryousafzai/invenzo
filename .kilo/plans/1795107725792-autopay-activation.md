# Plan: Automatic account activation via SafePay on signup

## Goal
Replace the manual "super admin approves after offline payment" flow with online
payment through SafePay (sandbox). The account is created **only after** a verified
successful payment, and is activated automatically (no manual approval). Pricing
links carry the chosen plan into the register form; the form redirects to SafePay
hosted checkout; a signed `payment.succeeded` webhook (with redirect fallback)
creates + activates the workspace.

## Decisions (confirmed with user)
- Account is created **only after payment** (form data is held in a `PendingRegistration` row, not a live `Business`).
- Integrate with the **official `@sfpy/node-sdk`**, **sandbox** environment (live later via env flag).
- **Lifetime** plan => account never expires (`subscriptionExpiresAt = null` + "never-expire" handling).
- **Remove** "first 1 month free"; charge the plan amount immediately.

## Plans & amounts (PKR, lowest denomination = x100)
| Plan    | Price (PKR) | amount sent to SafePay | Access after payment        |
|---------|-------------|------------------------|-----------------------------|
| Monthly | 2,499       | 249900                 | +1 month                    |
| Yearly  | 19,999      | 1999900                | +12 months                  |
| Lifetime| 49,999      | 4999900                | never expires (null expiry) |

Single source of truth: new `src/modules/billing/plans.ts` exporting `PLANS`
(key, name, priceMinor, currency:"PKR", accessMonths|null, displayName).

## New env vars (add to `.env.local`; keep existing `Public_Key`/`Secret_key`)
- `SAFEPAY_ENVIRONMENT=sandbox` (host: `https://sandbox.api.getsafepay.com`; live => `https://api.getsafepay.com`)
- `SAFEPAY_WEBHOOK_SECRET=` (HMAC shared secret from SafePay dashboard → Developers → Endpoints). **User must paste this.**
- Reuse `Public_Key` (apiKey / merchant key `sec_...`) and `Secret_key` (v1Secret).
- `APP_URL` already used for redirect/cancel base.

## Data model (`prisma/schema.prisma`)
1. `enum RegistrationStatus { PENDING COMPLETED CANCELLED FAILED }`
2. `model PendingRegistration`
   - `id`, `plan` (String), `status` (RegistrationStatus, default PENDING),
   - `form` (Json, the validated registration payload minus secrets),
   - `amountMinor` (Int), `currency` (default "PKR"),
   - `tracker` (String? @unique, SafePay tracker token),
   - `businessId` (String? , set once created), `userId` (String? , set once created),
   - `expiresAt` (DateTime, e.g. now+1h to match checkout token TTL),
   - `createdAt`, `updatedAt`; index on `status`, `tracker`.
3. `model PaymentEvent` (webhook idempotency)
   - `id`, `eventToken` (String @unique, `evt_...`), `type` (String),
   - `registrationId` (String?), `createdAt`.
4. `Business`: add `plan String? @db.VarChar(16)` (MONTHLY/YEARLY/LIFETIME) for renewals/reporting.
   - No change to `BusinessAccountStatus` enum (new accounts are written directly as `ACTIVE`).

Run: `pnpm db:migrate` (or `prisma migrate dev`) + `pnpm db:generate`.

## Never-expire handling (Lifetime: ACTIVE + null expiry)
Update every place that treats `subscriptionExpiresAt` as "must be in the future":
- `src/modules/businesses/subscription.ts` `getWorkspaceAccessStatus`: ACTIVE with `null` expiry stays ACTIVE (only expire when expiry is set and `<= now`). Currently line ~20 returns EXPIRED for null — change it.
- `src/auth.ts` (authorize ~L54-67 and jwt ~L106-119): active-business check must accept `subscriptionExpiresAt: null` OR `> now` (wrap in `OR`).
- Super-admin count/list queries that use `subscriptionExpiresAt: { gt: now }` / `{ lte: now }` must treat `null` as active (never expired):
  `src/app/super-admin/page.tsx`, `super-admin/approvals/page.tsx`,
  `super-admin/businesses/page.tsx`, `super-admin/payment-pending/page.tsx`.
  (Verification route already uses `getWorkspaceAccessStatus`, so it is covered.)

## New SafePay service layer
- `src/lib/safepay.ts`: build the SDK client from env
  `new Safepay({ environment, apiKey: Public_Key, v1Secret: Secret_key, webhookSecret })`
  and export helpers: `createCheckout({ amountMinor, currency, orderId, redirectUrl, cancelUrl })`
  (payments.create → checkout.create with `webhooks:true`), `fetchTracker(tracker)`,
  and `verifyWebhook(rawBody, signature)` (adapt Next `Request` to the SDK's expected
  `{ headers, rawBody }` shape; if the SDK cannot consume it, verify HMAC-SHA512 with
  `node:crypto` using `webhookSecret` and header `X-SFPY-SIGNATURE`).
- `src/modules/billing/activate.ts`: `activateRegistration(registrationId, { tracker, amountMinor, currency, eventToken? })`:
  - In one `prisma.$transaction`, atomically claim the registration
    (`updateMany where id + status PENDING` → COMPLETED; abort if count!=1 for idempotency).
  - Reuse the account-creation logic currently inline in `src/app/api/businesses/route.ts`
    (extract to `src/modules/businesses/create-account.ts`): create User + Business
    (`accountStatus: ACTIVE`, `plan`, `subscriptionStartedAt: now`,
    `subscriptionExpiresAt: addCalendarMonths(now, months)` or `null` for lifetime),
    default roles/permissions, OWNER membership, branch+warehouse, email-verification token.
  - `recordBusinessEvent(... newStatus:"ACTIVE", action:"business.payment_succeeded" ...)`
    with owner notice; do NOT create a PENDING_APPROVAL event.
  - Send verify-email (reuse logic) and link `businessId`/`userId` back on the registration.
  - Record `PaymentEvent` (dedupe by `eventToken`).
  - Amount/currency reconciliation: verify `amountMinor`/`currency` match the plan before activating.

## API routes / pages
- `POST /api/payments/checkout` (new `src/app/api/payments/checkout/route.ts`):
  rate-limited; validate registration payload (reuse `registrationSchema`) + `plan`;
  reject if email already a User; create `PendingRegistration` (PENDING, amount from plan,
  `expiresAt = now+1h`); call `createCheckout` with `orderId = registration.id`,
  `redirectUrl = APP_URL/checkout/complete`, `cancelUrl = APP_URL/checkout/cancel`;
  store `tracker`; return `{ url }`. (No account created yet.)
- `POST /api/payments/webhook` (new `src/app/api/payments/webhook/route.ts`):
  read **raw** body + `X-SFPY-SIGNATURE`; `verifyWebhook`; on valid
  `payment.succeeded` && `state==="TRACKER_ENDED"` → `activateRegistration` (idempotent).
  Always `200` quickly on valid signature; return `401` on bad signature.
- `src/app/checkout/complete/page.tsx` (redirect fallback): read `?tracker=`,
  `fetchTracker` → if `TRACKER_ENDED` call `activateRegistration` (idempotent), then
  send user to `/verify-email?sent=1`; otherwise show "payment processing" + poll link.
- `src/app/checkout/cancel/page.tsx`: friendly "payment cancelled, no account created" + link back to `/register`.
- Keep `/api/businesses` working by delegating to the extracted `create-account` module
  (or leave as-is for legacy/manual path). New signup uses the payment flow.

## Frontend changes
- `src/app/page.tsx` pricing: `href` per plan → `/register?plan=monthly|yearly|lifetime`;
  remove "First 1 month free" banner/pill (lines ~470-476, ~521-524) and the
  "Every plan includes your first month free" copy (line ~466). Keep PKR prices.
- `src/components/auth/register-form.tsx`:
  - read `plan` from `useSearchParams` (default monthly); show selected plan + amount.
  - submit → `POST /api/payments/checkout`; on `{ url }` → `window.location.assign(url)`.
  - update helper text: remove "reviewed by admin / offline payment" copy; replace with
    "You'll be redirected to secure payment. Your workspace is created instantly after payment."
- `src/app/register/page.tsx`: update subtitle copy (remove "before sign-in / approval" wording).
- `src/components/auth/email-action-form.tsx` / `verify-email` flow: unchanged (email verify still required to sign in).

## Security / correctness
- Webhook: verify HMAC before trusting payload; reconcile amount+currency+tracker to the stored
  `PendingRegistration`; idempotent via status claim + `PaymentEvent` unique token.
- Never create an account from redirect query params alone without a server-side tracker fetch.
- Checkout/redirect origins validated with existing `originIsAllowed` where relevant.
- Secrets only server-side; SafePay secret never sent to client.
- Rate-limit checkout endpoint (reuse `src/lib/rate-limit.ts`).

## Validation
- `pnpm db:generate` then `pnpm typecheck` and `pnpm lint`.
- `pnpm test` / `pnpm test:integration` (add unit tests for `getWorkspaceAccessStatus`
  null-expiry = ACTIVE, and plan→months/amount mapping).
- Manual sandbox smoke: submit register → land on SafePay sandbox hosted checkout →
  complete test card → webhook/redirect creates ACTIVE business → verify email → login works.
- Confirm Lifetime yields `subscriptionExpiresAt = null` and login/active checks pass.

## Open items requiring user input before/at implementation
- Paste `SAFEPAY_WEBHOOK_SECRET` (from sandbox dashboard) into `.env.local`.
- Confirm sandbox vs go-live timing (plan uses sandbox now).