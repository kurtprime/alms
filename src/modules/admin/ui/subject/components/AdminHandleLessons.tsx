import { Separator } from "@/components/ui/separator";
import React from "react";
import LessonCreate from "./LessonLeftSide";

export default function AdminHandleLessons() {
  return (
    <div className="grid grid-cols-[20%_10px_1fr] gap-0 h-full">
      <div className="p-4">
        <LessonCreate />
      </div>
      <Separator orientation="vertical" />
      {/* Second column: remaining space (80%) */}
      <div className="p-4">Remaining space</div>
    </div>
  );
}
