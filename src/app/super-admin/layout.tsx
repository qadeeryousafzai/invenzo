"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen && typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
    } else if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#e5efe5] text-[#17231f]">
      <AdminHeader
        name="Administrator"
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex pt-[72px]">
        <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 lg:pl-[288px]">{children}</main>
      </div>
    </div>
  );
}
