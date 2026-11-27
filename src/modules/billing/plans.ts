import { addCalendarMonths } from "@/modules/businesses/subscription";

export type BillingPlan = {
  key: "monthly" | "yearly" | "lifetime";
  name: string;
  price: number;
  amountMinor: number;
  currency: "PKR";
  accessMonths: number | null;
  displayName: string;
};

export const PLANS: Record<string, BillingPlan> = {
  monthly: {
    key: "monthly",
    name: "Monthly",
    price: 2499,
    amountMinor: 249900,
    currency: "PKR",
    accessMonths: 1,
    displayName: "Monthly — PKR 2,499/month",
  },
  yearly: {
    key: "yearly",
    name: "Yearly",
    price: 19999,
    amountMinor: 1999900,
    currency: "PKR",
    accessMonths: 12,
    displayName: "Yearly — PKR 19,999/year",
  },
  lifetime: {
    key: "lifetime",
    name: "Lifetime",
    price: 49999,
    amountMinor: 4999900,
    currency: "PKR",
    accessMonths: null,
    displayName: "Lifetime — PKR 49,999 one-time",
  },
} as const;

export function planForKey(key: string): BillingPlan | null {
  return PLANS[key] ?? null;
}

export function planExpiry(plan: BillingPlan, now: Date): Date | null {
  if (plan.accessMonths === null) return null;
  return addCalendarMonths(now, plan.accessMonths);
}
