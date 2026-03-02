"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonTypeRow } from "./lesson-type-row";
import { Session } from "@/lib/auth-client";
import { type Lesson } from "./types";
import { Badge } from "@/components/ui/badge";

export function TopicSection({
  lesson,
  session,
  defaultOpen = true,
  classId,
}: {
  lesson: Lesson[number];
  session: Session;
  defaultOpen?: boolean;
  classId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isTeacher = session.user.role === "teacher";

  // Sort by created at
  const items = lesson.lessonTypes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur supports-backdrop-filter:bg-slate-50/80 -mx-4 px-4 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center transition-colors",
                isOpen
                  ? "bg-slate-200 text-slate-600"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  !isOpen && "-rotate-90",
                )}
              />
            </div>

            <h3 className="font-bold text-slate-800 text-left">
              {lesson.name}
            </h3>
          </div>

          <Badge variant="secondary" className="font-medium text-xs">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </button>
      </div>
      {/* Content with Animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-2 pl-2 border-l-2 border-slate-200 ml-2.5">
          {items.map((item) => (
            <LessonTypeRow
              key={item.id}
              item={item}
              lessonName={lesson.name}
              classId={classId}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
