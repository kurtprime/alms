"use client";

import { useState } from "react";
import {
  FileText,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MDXRenderer } from "@/components/mdx-renderer";
import {
  UserViewLessonAssignment,
  UserViewLessonHandout,
} from "@/modules/user/server/userSchema";
import React from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface LessonContentViewerProps {
  data: UserViewLessonAssignment | UserViewLessonHandout;
}

export function LessonContentViewer({ data }: LessonContentViewerProps) {
  const [viewMode, setViewMode] = useState<"content" | "files">("content");
  const [currentDocIndex, setCurrentDocIndex] = useState(0);

  const hasContent = data.serializedMarkup;
  const documents = data.documents || [];
  const hasDocuments = documents.length > 0;

  // Auto-switch to files if no content exists but files do
  React.useEffect(() => {
    if (!hasContent && hasDocuments) {
      setViewMode("files");
    }
  }, [hasContent, hasDocuments]);

  const handlePrevDoc = () =>
    setCurrentDocIndex((prev) => Math.max(0, prev - 1));
  const handleNextDoc = () =>
    setCurrentDocIndex((prev) => Math.min(documents.length - 1, prev + 1));

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="shrink-0 border-b bg-slate-50 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {hasContent && (
            <Button
              variant={viewMode === "content" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("content")}
              className="text-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Content
            </Button>
          )}
          {hasDocuments && (
            <Button
              variant={viewMode === "files" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("files")}
              className="text-xs"
            >
              <Paperclip className="w-3.5 h-3.5 mr-1.5" />
              Files ({documents.length})
            </Button>
          )}
        </div>

        {/* File Pagination (Only show in file mode) */}
        {viewMode === "files" && documents.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrevDoc}
              disabled={currentDocIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 font-medium">
              {currentDocIndex + 1} / {documents.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextDoc}
              disabled={currentDocIndex === documents.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Viewer Content Area */}
      <div className="flex-1 relative min-h-0">
        {viewMode === "content" && (
          <ScrollArea className="h-full">
            <div className="p-6 prose prose-slate max-w-none">
              {hasContent ? (
                <div>
                  <MDXRenderer source={data.serializedMarkup} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <File className="w-12 h-12 mb-3" />
                  <p className="text-sm">No written content provided.</p>
                  {hasDocuments && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setViewMode("files")}
                      className="mt-2"
                    >
                      View attached files
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Document Viewer */}
        {viewMode === "files" && (
          <ScrollArea className="h-[calc(100vh-100px)]">
            <DocViewer
              key={currentDocIndex}
              documents={[
                {
                  uri: documents[currentDocIndex].fileUrl,
                  fileName:
                    documents[currentDocIndex].name ||
                    `Document ${currentDocIndex + 1}`,
                  fileType: documents[currentDocIndex].fileType || undefined,
                },
              ]}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: {
                  disableHeader: true,
                  disableFileName: true,
                },
                pdfVerticalScrollByDefault: true,
              }}
              style={{
                height: "100%",
                width: "100%",
              }}
            />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
