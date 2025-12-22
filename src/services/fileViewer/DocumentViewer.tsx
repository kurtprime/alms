// components/FileViewer.tsx
"use client";

import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { useTRPC } from "@/trpc/client";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface LessonDocument {
  fileUrl: string;
  id: number;
  name: string | null;
  lessonTypeId: number;
  fileHash: string | null;
  size: number | null;
  fileKey: string;
  fileUfsUrl: string | null;
  fileType: string | null;
  uploadedAt: string;
}

export function DocumentViewer() {
  const trpc = useTRPC();
  const [lessonTypeParams] = useLessonTypeParams();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isPending } = useQuery(
    trpc.admin.getLessonDocument.queryOptions({
      lessonId: lessonTypeParams.id ?? -1,
    })
  );

  // Reset index when data changes - with conditional check to avoid cascading renders

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg">
        <p className="text-gray-500">No documents found</p>
      </div>
    );
  }

  const docs = data.map((doc: LessonDocument) => ({
    uri: doc.fileUrl,
    fileName: doc.name || `Document ${doc.id}`,
    fileType: doc.fileType || undefined,
  }));

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(docs.length - 1, prev + 1));
  };

  // Check if it's an office document that needs iframe height fix
  const isOfficeDoc = docs[currentIndex]?.fileType?.match(
    /^(doc|docx|ppt|pptx|xls|xlsx)$/i
  );

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col bg-white">
      {/* Navigation Header - Fixed height */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-colors disabled:cursor-not-allowed text-sm font-medium"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === docs.length - 1}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-colors disabled:cursor-not-allowed text-sm font-medium"
          >
            Next →
          </button>
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {docs[currentIndex].fileName}
        </span>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {docs.length}
        </span>
      </div>

      {/* Document Viewer Container - Force consistent height */}
      <div
        className="relative flex-1 min-h-0 bg-gray-100"
        style={isOfficeDoc ? { minHeight: "70vh" } : undefined}
      >
        <DocViewer
          key={currentIndex}
          documents={[docs[currentIndex]]}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
              disableFileName: false,
            },
            pdfVerticalScrollByDefault: true,
          }}
          style={{
            height: "100%",
            width: "100%",
            minHeight: "500px",
          }}
        />
      </div>

      {/* Custom CSS to fix iframe height for office documents */}
      <style jsx global>{`
        #react-doc-viewer iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 500px;
          border: none;
        }

        #react-doc-viewer .react-doc-viewer__renderer {
          height: 100% !important;
          min-height: 500px;
        }

        #react-doc-viewer > div {
          height: 100% !important;
          min-height: 500px;
        }
      `}</style>
    </div>
  );
}
