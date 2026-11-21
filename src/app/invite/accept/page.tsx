import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { InviteAcceptForm } from "@/components/auth/invite-accept-form";
import Image from "next/image";

export default async function AcceptInvitationPage() {
  await connection();
  const session = await auth();
  return <main className="grid min-h-screen place-items-center px-5 py-12"><div className="surface-card w-full max-w-md p-7 sm:p-9"><Link href="/" className="mb-9 inline-flex items-center gap-2 text-lg font-bold text-foreground"><Image src="/logo/logo.png" alt="Invenzo" width={28} height={28} className="rounded-lg" /> invenzo<span className="-ml-2 text-primary">.</span></Link><Suspense fallback={<p className="text-sm text-muted-foreground">Loading invitation…</p>}><InviteAcceptForm authenticated={Boolean(session?.user)} /></Suspense></div></main>;
}