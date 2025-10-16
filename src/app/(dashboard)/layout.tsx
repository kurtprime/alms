import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/modules/admin/ui/admin/components/AdminSidebar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex justify-stretch items-stretch bg-sidebar flex-col min-h-screen w-full">
        {children}
      </main>
    </SidebarProvider>
  );
}
