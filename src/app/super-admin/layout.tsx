import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch {
    redirect("/login");
  }

  const [unreadNotifications] = await Promise.all([
    prisma.notification.count({
      where: {
        audience: "PLATFORM_ADMIN",
        OR: [{ userId: admin.id }, { userId: null }],
        readAt: null,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f8f6]">
      <AdminHeader
        name={admin.name ?? admin.email ?? "Administrator"}
        unreadNotifications={unreadNotifications}
      />
      <div className="flex">
        <SuperAdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}