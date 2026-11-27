import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/safepay";
import { activateRegistration } from "@/modules/billing/activate";

export async function POST(request: Request) {
  const signature = request.headers.get("X-SFPY-SIGNATURE");
  const rawBody = await request.arrayBuffer();
  if (!(await verifyWebhookSignature(Buffer.from(rawBody), signature))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(Buffer.from(rawBody).toString() || "{}");
  const type = String(payload.type ?? "");
  if (type !== "payment.succeeded") return NextResponse.json({ received: true });

  const tracker = String(payload.tracker ?? "");
  const state = String(payload.state ?? "");
  const eventToken = String(payload.event_token ?? payload.id ?? "");
  if (!tracker || state !== "TRACKER_ENDED") return NextResponse.json({ received: true });

  const registration = await prisma.pendingRegistration.findFirst({
    where: { tracker, status: "PENDING" },
    select: { id: true, tracker: true, amountMinor: true, currency: true },
  });
  if (!registration) return NextResponse.json({ received: true });

  await activateRegistration({
    registrationId: registration.id,
    tracker,
    amountMinor: registration.amountMinor,
    currency: registration.currency,
    eventToken: eventToken || undefined,
  }).catch((error) => {
    console.error("[payment webhook] activation failed", error);
  });

  return NextResponse.json({ received: true });
}
