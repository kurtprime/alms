import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderClosed, Users } from "lucide-react";
import React from "react";
import ClassSubjectClient from "../ClassSubjectClient";
import { Session } from "@/lib/auth-client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const studentItems = [
  {
    title: "Classes",
    url: "#",
    icon: Users,
    content: (session: Session) => <ClassSubjectClient session={session} />,
  },
  {
    title: "To Do",
    url: "#",
    icon: FolderClosed,
    content: (session: Session) => (
      <div className="p-2">Hello world {session.user.name}</div>
    ),
  },
];

export default function StudentSideBarAccordion({
  session,
}: {
  session: Session;
}) {
  return (
    <>
      {studentItems.map((item) => (
        <SidebarAccordionItem key={item.title} item={item} session={session} />
      ))}
    </>
  );
}

function SidebarAccordionItem({
  item,
  session,
}: {
  item: (typeof studentItems)[number];
  session: Session;
}) {
  return (
    <>
      {/* --- MOBILE/TABLET VIEW: Standard Accordion --- */}
      <AccordionItem className="border-none block lg:hidden" value={item.title}>
        <AccordionTrigger className="p-2 hover:bg-sidebar-accent cursor-pointer px-4 border-none bg-sidebar shadow-none flex flex-row-reverse items-center justify-between">
          <span className="flex items-center gap-2">
            <item.icon className="w-4 h-4" /> {item.title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-0 ml-6 w-[calc(100%-1rem)] mt-0 mb-4 border-l">
          {item.content(session)}
        </AccordionContent>
      </AccordionItem>

      {/* --- DESKTOP VIEW: Hover Side Panel --- */}
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
            {/* Header inside the hover card for context */}
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
