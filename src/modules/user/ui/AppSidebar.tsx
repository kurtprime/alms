"use client";
import { Calendar, FolderClosed, Home, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
];

const teacherItems = [
  {
    title: "Classes",
    url: "#",
    icon: Users,
  },
  {
    title: "To Check",
    url: "#",
    icon: FolderClosed,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="p-5 " asChild>
                    <a className="text-2xl" href={item.url}>
                      <item.icon className="size-10" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <DynamicSideBar />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function DynamicSideBar() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return <Spinner />;
  }

  if (session.user.role === "teacher")
    return teacherItems.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton className="p-5" asChild>
          <a className="text-2xl" href={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  if (session.user.role === "student") return <div>student</div>;
}
