"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Session } from "@/lib/auth-client";
import { type Lesson } from "./types";
import { useDocumentViewer } from "./context";
import { ViewerToggle } from "./viewer-toggle";
import { EmptyState } from "./empty-state";
import { DocumentViewerPanel } from "./document-viewer-panel";
import { TopicSection } from "./ topic-section";

// ============================================
// RESIZABLE CONTENT WRAPPER
// ============================================

export function ResizableContent({
  classId,
  isTeacher,
  lessons,
  session,
}: {
  classId: string;
  isTeacher: boolean;
  lessons: Lesson;
  session: Session;
}) {
  const { isViewerOpen } = useDocumentViewer();

  return (
    <ResizablePanelGroup direction="horizontal">
      {/* Left Panel - Lesson List */}
      <ResizablePanel defaultSize={isViewerOpen ? 60 : 100} minSize={30}>
        <div className="h-full overflow-auto">
          <div className="w-full mx-auto px-4 md:px-15 py-6">
            <ViewerToggle />

            {/* Content List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-4">
                {lessons.map((lesson) => (
                  <TopicSection
                    key={lesson.id}
                    classId={classId}
                    session={session}
                    lesson={lesson}
                  />
                ))}

                {lessons.length === 0 && (
                  <EmptyState isTeacher={isTeacher} classId={classId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </ResizablePanel>

      {/* Resizable Handle */}
      {isViewerOpen && (
        <ResizableHandle className="bg-slate-200 hidden lg:block hover:bg-blue-400 h-[calc(100vh-100px)] transition-colors" />
      )}

      {/* Right Panel - Document Viewer */}
      {isViewerOpen && (
        <ResizablePanel
          className="hidden lg:block"
          defaultSize={40}
          minSize={25}
          maxSize={70}
        >
          <DocumentViewerPanel isTeacher={isTeacher} classId={classId} />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
