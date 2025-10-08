"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SidebarUserButton from "@/components/SidebarUserButton";
import { AdminItems } from "../../../constants";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelRight } from "lucide-react";

export default function AdminSidebar() {
  const items = AdminItems;
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  return (
    <Sidebar className="border-none" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center my-4">
            <SidebarMenuButton
              onClick={() => setOpen(!open)}
              size="lg"
              className="hover:bg-transparent max-md:hidden"
            >
              {!open ? <PanelLeftClose /> : <PanelRight />}
              <span className="text-lg">ALMS Admin</span>
            </SidebarMenuButton>
            <span className="text-lg md:hidden">ALMS Admin</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-2">
              {items.map((item) => {
                const isActive = pathname.includes(item.url);

                return (
                  <SidebarMenuItem
                    className="w-full flex justify-center"
                    key={item.title}
                  >
                    <SidebarMenuButton
                      size="lg"
                      className={cn(
                        "hover:bg-accent/50",
                        isActive &&
                          "bg-primary/50 hover:bg-primary/45 active:bg-primary/50"
                      )}
                      asChild
                    >
                      <Link
                        href={item.url}
                        className="group-data-[collapsible=icon]:p-0!"
                      >
                        <item.icon />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-accent-foreground group-data-[collapsible=icon]:size-13 group-data-[collapsible=icon]:mb-3">
        <SidebarUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
