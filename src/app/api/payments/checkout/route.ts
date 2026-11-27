import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { registrationSchema } from "@/modules/businesses/registration-schema";
import { planForKey } from "@/modules/billing/plans";
import { createCheckout } from "@/lib/safepay";

const checkoutSchema = registrationSchema.extend({
  plan: z.enum(["monthly", "yearly", "lifetime"]),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`checkout:${requestIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the registration details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const planKey = data.plan;

  const plan = planForKey(planKey);
  if (!plan) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  let existing;
  try {
    existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  } catch {
    return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 503 });
  }
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const appUrl = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

  let registration;
  try {
    registration = await prisma.pendingRegistration.create({
      data: {
        plan: planKey,
        status: "PENDING",
        form: data,
        amountMinor: plan.amountMinor,
        currency: plan.currency,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[payments/checkout] pendingRegistration create failed:", error);
    return NextResponse.json({ error: "Checkout could not be started. Database may not be configured. Try again." }, { status: 500 });
  }

  let checkout;
  try {
    checkout = await createCheckout({
      amountMinor: plan.amountMinor,
      currency: plan.currency,
      orderId: registration.id,
      redirectUrl: `${appUrl}/checkout/complete`,
      cancelUrl: `${appUrl}/checkout/cancel`,
    });
  } catch (error) {
    await prisma.pendingRegistration.delete({ where: { id: registration.id } }).catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payments/checkout] SafePay checkout failed:", message);
    return NextResponse.json({ error: `Payment service unavailable: ${message}` }, { status: 503 });
  }

  await prisma.pendingRegistration.update({
    where: { id: registration.id },
    data: { tracker: checkout.tracker },
  });

  return NextResponse.json({ url: checkout.url }, { status: 201 });
}
