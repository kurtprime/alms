"use client";
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserItems } from "@/modules/admin/constants";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function AdminUserHeader() {
  return (
    <>
      <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-between my-5 md:my-4 md:px-14 px-2">
        <h2 className="text-lg text-accent-foreground font-semibold">
          <SidebarTrigger className="md:hidden" />
          User List
        </h2>
        <div className="w-full md:w-auto">
          <TabsList className="bg-background/50 border-b border-border py-6 flex justify-center md:justify-end">
            {UserItems.map((item) => (
              <TabsTrigger
                className="p-5 font-semibold text-md"
                key={item.title}
                value={item.value}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      <Separator className=" md:mb-5" />
    </>
  );
}
