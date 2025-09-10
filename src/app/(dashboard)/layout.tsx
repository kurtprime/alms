import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/modules/admin/ui/components/AdminSidebar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex bg-sidebar flex-col h-screen w-screen">
        {children}
      </main>
    </SidebarProvider>
  );
}
