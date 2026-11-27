import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchTracker } from "@/lib/safepay";
import { activateRegistration } from "@/modules/billing/activate";
import { LoaderCircle } from "lucide-react";

export default async function CheckoutCompletePage({ searchParams }: { searchParams: Promise<{ tracker?: string }> }) {
  const params = await searchParams;
  const tracker = typeof params.tracker === "string" ? params.tracker : "";
  if (!tracker) redirect("/register");

  try {
    const state = (await fetchTracker(tracker)).state;
    if (state === "TRACKER_ENDED") {
      const registration = await prisma.pendingRegistration.findFirst({
        where: { tracker, status: "PENDING" },
        select: { id: true, amountMinor: true, currency: true },
      });
      if (registration) {
        await activateRegistration({ registrationId: registration.id, tracker, amountMinor: registration.amountMinor, currency: registration.currency });
      }
    }
  } catch {
    // fall through; polling page handles the in-flight state
  }

  const registration = await prisma.pendingRegistration.findFirst({ where: { tracker } });
  if (registration?.status === "COMPLETED") redirect("/verify-email?sent=1");

  return (
    <main className="min-h-screen place-items-center px-5 py-12">
      <div className="surface-card w-full max-w-md p-7 sm:p-9">
        <div className="flex items-center gap-2 mb-3"><LoaderCircle className="animate-spin h-5 w-5" /><h1 className="text-xl font-bold text-foreground">Payment is being processed</h1></div>
        <p className="mt-2 text-sm text-muted-foreground">Your workspace is being activated. Once the payment is confirmed, you will be asked to verify your email before signing in.</p>
      </div>
    </main>
  );
}
