"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { LessonDocument } from "@/modules/user/types/addLesson";

interface DocumentPreviewDialogProps {
  doc: LessonDocument | null;
  allDocs: LessonDocument[] | undefined;
  onClose: () => void;
  onDelete: (doc: LessonDocument) => void;
}

export function DocumentPreviewDialog({
  doc,
  allDocs,
  onClose,
  onDelete,
}: DocumentPreviewDialogProps) {
  const [manualIndex, setManualIndex] = useState(0);

  // Calculate initial index based on the doc being previewed
  const initialIndex = useMemo(() => {
    if (doc && allDocs) {
      const idx = allDocs.findIndex((d) => d.id === doc.id);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  }, [doc, allDocs]);

  // Use manual index if user has navigated, otherwise use initial
  const currentIndex = manualIndex !== 0 ? manualIndex : initialIndex;

  // Reset manual index when doc changes
  const resetIndex = () => setManualIndex(0);

  if (!doc || !allDocs || allDocs.length === 0) return null;

  const currentDoc = allDocs[currentIndex];
  const docs = allDocs.map((d) => ({
    uri: d.fileUrl,
    fileName: d.name || `Document ${d.id}`,
    fileType: d.fileType || undefined,
  }));

  const handlePrevious = () => {
    setManualIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    setManualIndex(Math.min(allDocs.length - 1, currentIndex + 1));
  };

  const handleClose = () => {
    resetIndex();
    onClose();
  };

  const handleDelete = (docToDelete: LessonDocument) => {
    resetIndex();
    onDelete(docToDelete);
  };

  return (
    <ResponsiveDialog
      title={currentDoc?.name || "Document Preview"}
      open={!!doc}
      onOpenChange={(open) => !open && handleClose()}
      className="max-w-5xl"
    >
      <div className="flex flex-col">
        {/* Navigation */}
        {allDocs.length > 1 && (
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Badge variant="secondary">
              {currentIndex + 1} of {allDocs.length}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === allDocs.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Document Viewer */}
        <div className="min-h-[60vh] max-h-[70vh] overflow-auto bg-muted/20">
          <DocViewer
            key={currentIndex}
            documents={[docs[currentIndex]]}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: true,
                disableFileName: true,
              },
              pdfVerticalScrollByDefault: false,
            }}
            style={{
              height: "60vh",
              width: "100%",
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {currentDoc?.name}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => currentDoc && handleDelete(currentDoc)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Global styles for doc viewer */}
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
    </ResponsiveDialog>
  );
}
