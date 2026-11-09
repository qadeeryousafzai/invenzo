import { connection } from "next/server";
import { redirect } from "next/navigation";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function AdminNotificationsPage() {
  await connection();
  let admin;
  try { admin = await requireSuperAdmin(); } catch { redirect("/login"); }
  const where = { audience: "PLATFORM_ADMIN" as const, OR: [{ userId: admin.id }, { userId: null }] };
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, include: { business: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ]);
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">PLATFORM UPDATES</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">Registration, account state, and expiry events for the platform.</p>
      </div>
      <NotificationInbox notifications={notifications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null }))} unreadCount={unreadCount} audience="platform" />
    </main>
  );
}