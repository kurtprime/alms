import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderClosed, Users } from "lucide-react";
import React from "react";
import ClassSubjectClient from "../ClassSubjectClient";
import { Session } from "@/lib/auth-client";

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
    content: (session: Session) => <div>Hello world {session.user.name}</div>,
  },
];

export default function StudentSideBarAccordion({
  session,
}: {
  session: Session;
}) {
  return studentItems.map((item) => (
    <SidebarAccordionItem key={item.title} item={item} session={session} />
  ));
}

function SidebarAccordionItem({
  item,
  session,
}: {
  item: (typeof studentItems)[number];
  session: Session;
}) {
  return (
    <AccordionItem className="border-none" key={item.title} value={item.title}>
      <AccordionTrigger className="p-2  hover:bg-sidebar-accent cursor-pointer px-4 border-none bg-sidebar shadow-none flex flex-row-reverse items-center justify-between">
        <span className="flex items-center gap-2">
          <item.icon className="w-4 h-4" /> {item.title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="p-0 ml-6 w-[calc(100%-1rem)] mt-0 mb-4 border-l">
        {item.content(session)}
      </AccordionContent>
    </AccordionItem>
  );
}
