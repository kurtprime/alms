"use client";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";
import { UserGetCurrentSectionInfo } from "../../server/userSchema";
import { useIsActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Session } from "@/lib/auth-client";

export default function ClassSubjectClient({ session }: { session: Session }) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.user.getCurrentSectionInfo.queryOptions(),
  );

  return (
    <>
      {data.map((subject) => {
        return (
          <SidebarMenuItemInfo
            subject={subject}
            key={subject.id}
            session={session}
          />
        );
      })}
    </>
  );
}

function SidebarMenuItemInfo({
  subject,
  session,
}: {
  subject: UserGetCurrentSectionInfo[number];
  session: Session;
}) {
  const isActive = useIsActivePath(`/class/${subject.id}`);
  const isTeacher = session.user.role === "teacher";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          "flex flex-col justify-start items-start h-15 gap-1",
          isActive && "bg-primary/40 hover:bg-primary/60",
        )}
        asChild
      >
        <Link href={`/class/${subject.id}`} className="w-full">
          <span>{subject.subjectName}</span>
          <span className="text-muted-foreground text-xs">
            ({isTeacher ? subject.enrolledClass.name : subject.teacher})
          </span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuBadge className="pr-3">
        {subject.subjectCode}
      </SidebarMenuBadge>
    </SidebarMenuItem>
  );
}
