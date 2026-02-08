import React from "react";
import LessonCreate from "./LessonLeftSide";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import LessonRightSide from "./LessonRightSide";
import { DisplayLessons } from "./DisplayLesson";

export default function AdminHandleLessons() {
  return (
    <ResizablePanelGroup direction="horizontal" className=" h-full ">
      <ResizablePanel
        defaultSize={25}
        maxSize={50}
        className="bg-background rounded-bl-2xl"
      >
        <ScrollArea className="h-[calc(100vh-130px)] px-3 pt-2">
          <LessonCreate className="w-full" />
          <DisplayLessons />
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <ScrollArea className=" h-[calc(100vh-110px)]">
          <LessonRightSide />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
