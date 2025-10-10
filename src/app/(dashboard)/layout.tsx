import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/modules/admin/ui/admin/components/AdminSidebar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <ScrollArea className="flex-1">
        <main className="flex bg-sidebar flex-col min-h-screen ">
          {children}
        </main>
      </ScrollArea>
    </SidebarProvider>
  );
}
