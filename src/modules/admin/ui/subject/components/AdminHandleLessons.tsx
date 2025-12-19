import { Separator } from "@/components/ui/separator";
import React from "react";
import LessonCreate from "./LessonLeftSide";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function AdminHandleLessons() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="grid grid-cols-[20%_10px_1fr] gap-0 h-full "
    >
      <ResizablePanel
        defaultSize={25}
        maxSize={50}
        className="p-1 bg-background"
      >
        <LessonCreate />
      </ResizablePanel>
      <ResizableHandle />
      {/* Second column: remaining space (80%) */}
      <ResizablePanel defaultSize={75} className="p-4">
        Remaining space
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
