import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/modules/admin/ui/admin/components/AdminSidebar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full my-4 md:mr-4 border bg-muted rounded-2xl flex flex-col gap-1">
      {children}
    </div>
  );
}
