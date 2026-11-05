import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { prisma } from "@/lib/prisma";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, emailVerified: true } });
  if (!user) redirect("/login");
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">ACCOUNT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Personal settings</h1><p className="mt-2 text-sm text-slate-500">Manage your profile and account security.</p></div><ProfileForm name={user.name ?? ""} email={user.email} verified={Boolean(user.emailVerified)} /></div>;
}
