import { createHmac, timingSafeEqual } from "node:crypto";

const SANDBOX_HOST = "https://sandbox.api.getsafepay.com";
const LIVE_HOST = "https://api.getsafepay.com";

type Environment = "sandbox" | "live";

type SafepayConfig = {
  environment: Environment;
  apiKey: string;
  v1Secret: string;
  webhookSecret: string;
};

function config(): SafepayConfig {
  const environment = (process.env.SAFEPAY_ENVIRONMENT ?? "sandbox") as Environment;
  return {
    environment,
    apiKey: process.env.Public_Key ?? "",
    v1Secret: process.env.Secret_key ?? "",
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET ?? "",
  };
}

function gatewayHost(environment: Environment): string {
  return environment === "live" ? LIVE_HOST : SANDBOX_HOST;
}

export type CheckoutResult = { url: string; tracker: string };

export async function createCheckout(input: {
  amountMinor: number;
  currency: string;
  orderId: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { environment, apiKey, v1Secret } = config();
  const response = await fetch(`${gatewayHost(environment)}/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${v1Secret}`,
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      order_id: input.orderId,
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
      webhooks: true,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`SafePay checkout failed (${response.status})${text ? `: ${text}` : ""}`);
  }
  const data = await response.json();
  return { url: String(data.url), tracker: String(data.tracker) };
}

export type TrackerState = { state: string; amount: number; currency: string };

export async function fetchTracker(tracker: string): Promise<TrackerState> {
  const { environment, apiKey, v1Secret } = config();
  const response = await fetch(`${gatewayHost(environment)}/v1/trackers/${encodeURIComponent(tracker)}`, {
    headers: {
      Authorization: `Bearer ${v1Secret}`,
      "X-Api-Key": apiKey,
    },
  });
  if (!response.ok) throw new Error(`SafePay tracker lookup failed (${response.status}).`);
  const data = await response.json();
  return { state: String(data.state ?? ""), amount: Number(data.amount ?? 0), currency: String(data.currency ?? "") };
}

export function verifyWebhookSignature(rawBody: string | Buffer, signature: string | null | undefined): boolean {
  const { webhookSecret } = config();
  if (!signature || !webhookSecret) return false;
  const expected = createHmac("sha512", webhookSecret).update(typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
