import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";
import { PlatformSettingsForm } from "@/components/super-admin/platform-settings-form";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function PlatformSettingsPage() {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const settings = await prisma.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default", defaultAccessMonths: 1, expiryWarningDays: 7 } });
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8">
      <Link href="/super-admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={14} /> Back to super admin
      </Link>
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM CONFIGURATION</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950">
          <Settings2 size={25} className="text-emerald-800" />Platform settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">Control account validity defaults and scheduled expiry notifications.</p>
      </div>
      <PlatformSettingsForm defaultAccessMonths={settings.defaultAccessMonths} expiryWarningDays={settings.expiryWarningDays} />
    </main>
  );
}