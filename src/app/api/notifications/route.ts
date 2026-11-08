import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const isAdmin = session.user.platformRole === "SUPER_ADMIN";
    let where: Prisma.NotificationWhereInput;
    if (isAdmin) {
      const admin = await requireSuperAdmin();
      where = { audience: "PLATFORM_ADMIN", OR: [{ userId: admin.id }, { userId: null }] };
    } else {
      const tenant = await requireTenantContext();
      where = { audience: "BUSINESS_USER", userId: tenant.userId, businessId: { in: tenant.memberships.map((membership) => membership.businessId) } };
    }
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, include: { business: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);
    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Notification list failed", error);
    return NextResponse.json({ error: "Notifications could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = z.object({ id: z.string().min(1).max(191).optional(), markAll: z.boolean().optional() }).strict().safeParse(await request.json().catch(() => null));
    if (!body.success || (!body.data.id && !body.data.markAll)) return NextResponse.json({ error: "Choose a notification to mark as read." }, { status: 400 });
    const isAdmin = session.user.platformRole === "SUPER_ADMIN";
    let visibility: Prisma.NotificationWhereInput;
    if (isAdmin) {
      const admin = await requireSuperAdmin();
      visibility = { audience: "PLATFORM_ADMIN", OR: [{ userId: admin.id }, { userId: null }] };
    } else {
      const tenant = await requireTenantContext();
      visibility = { audience: "BUSINESS_USER", userId: tenant.userId, businessId: { in: tenant.memberships.map((membership) => membership.businessId) } };
    }
    const where = { ...visibility, ...(body.data.id ? { id: body.data.id } : {}), readAt: null };
    const updated = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
    return NextResponse.json({ updated: updated.count });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Notification update failed", error);
    return NextResponse.json({ error: "Notification could not be updated." }, { status: 500 });
  }
}
