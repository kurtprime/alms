import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/modules/user/ui/AppSidebar";
import UserNavigation from "@/modules/user/ui/UserNavigation";
import { TRPCReactProvider } from "@/trpc/client";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex justify-stretch items-stretch bg-background flex-col min-h-screen w-full">
          <UserNavigation />
          {children}
        </main>
      </SidebarProvider>
    </TRPCReactProvider>
  );
}
