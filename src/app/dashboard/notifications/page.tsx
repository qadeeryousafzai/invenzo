import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";

export default async function BusinessNotificationsPage() {
  let context;
  try { context = await requireTenantContext(); } catch { redirect("/login"); }
  const where = { audience: "BUSINESS_USER" as const, userId: context.userId, businessId: { in: context.memberships.map((membership) => membership.businessId) } };
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, include: { business: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ]);
  return <div className="space-y-6"><div><p className="text-xs font-bold tracking-[.15em] text-emerald-800">ACCOUNT UPDATES</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950"><Bell size={25} className="text-emerald-800" />Notifications</h1><p className="mt-2 text-sm text-slate-500">Important account updates for your businesses.</p></div><NotificationInbox notifications={notifications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null }))} unreadCount={unreadCount} audience="business" /></div>;
}
