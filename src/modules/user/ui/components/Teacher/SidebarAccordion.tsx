import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderClosed, Users } from "lucide-react";
import React from "react";
import ClassSubjectClient from "../ClassSubjectClient";
import { Session } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const teacherItems = [
  {
    title: "Classes",
    url: "#",
    icon: Users,
    content: (session: Session) => <ClassSubjectClient session={session} />,
  },
];

export default function SidebarAccordion({ session }: { session: Session }) {
  return (
    <>
      {teacherItems.map((item) => (
        <SidebarAccordionItem key={item.title} item={item} session={session} />
      ))}

      {/* --- 'To Check' Button Logic --- */}

      {/* MOBILE: Standard Button/Link (visible) */}
      <div className="block lg:hidden">
        <Button
          className="p-2 w-full hover:bg-sidebar-accent cursor-pointer px-4 border-none bg-sidebar shadow-none flex hover:text-muted items-center justify-between"
          variant="ghost"
          asChild
        >
          <Link href="/check/s">
            <span className="flex items-center gap-2">
              <FolderClosed className="w-4 h-4" /> To Check
            </span>
          </Link>
        </Button>
      </div>

      {/* DESKTOP: Hover Button (visible) */}
      <div className="hidden lg:block">
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Button
              className="w-full justify-start gap-2 px-4 py-2 hover:bg-sidebar-accent"
              variant="ghost"
            >
              <FolderClosed className="w-4 h-4" />
              <span>To Check</span>
            </Button>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            className="w-80 p-4 border-l shadow-lg ml-2 rounded-lg"
          >
            {/* Mock content for 'To Check' if needed, or just a link */}
            <div className="space-y-2">
              <p className="font-semibold">Pending Reviews</p>
              <p className="text-sm text-muted-foreground">
                Click below to view submissions.
              </p>
              <Button asChild className="w-full mt-2">
                <Link href="/check/s">Open Checker</Link>
              </Button>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </>
  );
}

function SidebarAccordionItem({
  item,
  session,
}: {
  item: (typeof teacherItems)[number];
  session: Session;
}) {
  return (
    <>
      {/* MOBILE: Accordion */}
      <AccordionItem
        className="border-none block lg:hidden"
        key={item.title}
        value={item.title}
      >
        <AccordionTrigger className="p-2 hover:bg-sidebar-accent cursor-pointer px-4 border-none bg-sidebar shadow-none flex flex-row-reverse items-center justify-between">
          <span className="flex items-center gap-2">
            <item.icon className="w-4 h-4" /> {item.title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-0 ml-6 w-[calc(100%-1rem)] mt-0 mb-4 border-l">
          {item.content(session)}
        </AccordionContent>
      </AccordionItem>

      {/* DESKTOP: Hover Side Panel */}
      <div className="hidden lg:block">
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-4 py-2 hover:bg-sidebar-accent"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </Button>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            className="w-80 p-0 border-l shadow-lg ml-2 rounded-lg"
          >
            <div className="px-4 py-2 border-b bg-muted/50 font-semibold text-sm">
              {item.title}
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {item.content(session)}
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </>
  );
}
