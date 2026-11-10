"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/super-admin/admin-header";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8f6]">
      <AdminHeader
        name="Administrator"
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex">
        <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}