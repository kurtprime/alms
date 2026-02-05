import { SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentAdmin } from "@/lib/auth-server";
import AdminSidebar from "@/modules/admin/ui/admin/components/AdminSidebar";
import { TRPCReactProvider } from "@/trpc/client";
import React from "react";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentAdmin();
  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <AdminSidebar />
        <main className="flex justify-stretch items-stretch bg-sidebar flex-col min-h-screen w-full">
          {children}
        </main>
      </SidebarProvider>
    </TRPCReactProvider>
  );
}
