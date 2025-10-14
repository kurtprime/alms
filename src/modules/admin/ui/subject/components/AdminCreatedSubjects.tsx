"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";
import SubjectContent from "./SubjectContent";

export default function AdminCreatedSubjects() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.getAllAdminSubject.queryOptions({})
  );
  return (
    <Accordion type="multiple" className="w-full md:px-8">
      {data ? (
        data.map((subject, index) => (
          <AccordionItem key={subject.id} value={subject.id ?? `${index}`}>
            <AccordionTrigger className="flex">
              <span className="flex-1"> {subject.subjectName}</span>
              <span className="flex gap-4">
                <Badge variant="outline">{subject.subjectCount} Classes</Badge>
                <Badge variant="outline">{subject.teacherCount} Teachers</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <SubjectContent subjectId={subject.id} />
            </AccordionContent>
          </AccordionItem>
        ))
      ) : (
        <div>No subjects created yet.</div>
      )}
    </Accordion>
  );
}
