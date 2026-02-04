"use client";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { isActivePath, useIsActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
];

export default function SidebarMenuItemsParams() {
  return (
    <>
      {items.map((item) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const isActive = useIsActivePath(item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              className={cn(
                "p-5 ",
                `${isActive ? "bg-primary/40 hover:bg-primary/60 text-white" : ""}`,
              )}
              asChild
            >
              <Link className="text-2xl" href={item.url}>
                <item.icon className="size-10" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
