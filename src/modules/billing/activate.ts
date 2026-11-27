import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail, safeEmailHtml } from "@/lib/email";
import { createAccount } from "@/modules/businesses/create-account";
import { planForKey, planExpiry } from "@/modules/billing/plans";
import type { BusinessType } from "@prisma/client";

export type ActivateInput = {
  registrationId: string;
  tracker: string;
  amountMinor: number;
  currency: string;
  eventToken?: string;
};

export type ActivateResult = {
  activated: boolean;
  reason?: string;
  businessId?: string;
  userId?: string;
};

export async function activateRegistration(input: ActivateInput): Promise<ActivateResult> {
  const { registrationId, tracker, amountMinor, currency, eventToken } = input;

  if (eventToken) {
    const existing = await prisma.paymentEvent.findUnique({ where: { eventToken } });
    if (existing) return { activated: false, reason: "duplicate_event" };
  }

  const registration = await prisma.pendingRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return { activated: false, reason: "not_found" };
  if (registration.status !== "PENDING") return { activated: false, reason: `status_${registration.status}` };
  if (registration.tracker !== tracker) return { activated: false, reason: "tracker_mismatch" };
  if (registration.amountMinor !== amountMinor || registration.currency !== currency) return { activated: false, reason: "amount_mismatch" };

  const plan = planForKey(registration.plan);
  if (!plan) return { activated: false, reason: "unknown_plan" };

  const now = new Date();
  const claim = await prisma.pendingRegistration.updateMany({
    where: { id: registrationId, status: "PENDING" },
    data: { status: "COMPLETED", updatedAt: now },
  });
  if (claim.count !== 1) return { activated: false, reason: "already_claimed" };

  const form = registration.form as Record<string, unknown>;
  const created = await createAccount({
    ownerName: String(form.ownerName ?? ""),
    email: String(form.email ?? ""),
    password: String(form.password ?? ""),
    businessName: String(form.businessName ?? ""),
    businessType: (form.businessType ?? "GENERAL_RETAIL") as BusinessType,
    phone: form.phone ? String(form.phone) : null,
    address: form.address ? String(form.address) : null,
    description: form.description ? String(form.description) : null,
    taxId: form.taxId ? String(form.taxId) : null,
    website: form.website ? String(form.website) : null,
    currency: String(form.currency ?? "PKR"),
    timezone: String(form.timezone ?? "UTC"),
    branchName: String(form.branchName ?? "Main branch"),
    branchCode: String(form.branchCode ?? "MAIN"),
    branchPhone: form.branchPhone ? String(form.branchPhone) : null,
    branchAddress: form.branchAddress ? String(form.branchAddress) : null,
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    plan: registration.plan,
    subscriptionExpiresAt: planExpiry(plan, now),
  });

  const eventTokenFinal = eventToken ?? `evt_${registration.id}`;
  await prisma.$transaction([
    prisma.paymentEvent.create({
      data: { eventToken: eventTokenFinal, type: "payment.succeeded", registrationId },
    }),
    prisma.pendingRegistration.update({
      where: { id: registrationId },
      data: { businessId: created.business.id, userId: created.user.id },
    }),
  ]);

  try {
    const appUrl = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
    const link = new URL("/verify-email", appUrl);
    link.searchParams.set("token", created.verificationToken);
    await sendTransactionalEmail(created.user.email, "Verify your Invenzo account", safeEmailHtml("Verify your email address", link.toString(), "Verify email"));
  } catch {
    // Account is active; email delivery failure must not block activation.
  }

  return { activated: true, businessId: created.business.id, userId: created.user.id };
}
