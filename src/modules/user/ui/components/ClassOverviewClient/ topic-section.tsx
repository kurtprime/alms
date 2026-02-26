"use client";

import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Session } from "@/lib/auth-client";
import { type Lesson } from "./types";
import { LessonTypeRow } from "./lesson-type-row";

// ============================================
// TOPIC SECTION
// ============================================

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

  const items = lesson.lessonTypes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      {/* Section Header */}
      <div
        className={cn(
          "w-full flex items-center justify-between py-2 px-2 rounded-md",
          "hover:bg-slate-50 transition-colors",
          "cursor-pointer select-none",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <h3 className="font-semibold text-slate-700 text-sm truncate">
            {lesson.name}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Items */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
