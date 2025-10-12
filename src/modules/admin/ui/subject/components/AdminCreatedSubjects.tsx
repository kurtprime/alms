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
    <Accordion type="single" collapsible className="w-full md:px-8">
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
            <AccordionContent>
              <SubjectContent subjectId={subject.id} />
            </AccordionContent>
          </AccordionItem>
        ))
      ) : (
        <div>No subjects created yet.</div>
      )}
      <AccordionItem value="item-1">
        <AccordionTrigger>Product Information</AccordionTrigger>
        <AccordionContent>
          <p>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </p>
          <p>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
