// components/FileViewer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { useTRPC } from "@/trpc/client";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ResponsiveDialog from "@/components/responsive-dialog";
import { toast } from "sonner";

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
  const [areYouSure, setAreYouSure] = useState(false);

  const { data, isPending } = useQuery(
    trpc.admin.getLessonDocument.queryOptions({
      lessonId: lessonTypeParams.id ?? -1,
    })
  );

  if (isPending) {
    return (
      <Card className="border rounded-lg overflow-hidden">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-8 rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">
              Loading documents...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
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
    <>
      <Card className="border p-0 rounded-lg w-full overflow-hidden flex flex-col bg-white">
        {/* Navigation Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted border-b space-y-0">
          <div className="flex items-center gap-2">
            {data.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-3 py-1.5"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === docs.length - 1}
                  className="px-3 py-1.5"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
          <span className="text-sm font-medium text-foreground overflow-hidden text-nowrap text-ellipsis">
            {docs[currentIndex].fileName}
          </span>
          <span className="flex flex-row justify-center items-center">
            <Badge variant="outline" className="text-sm mr-2">
              {currentIndex + 1} of {docs.length}
            </Badge>
            <Button variant={"destructive"} onClick={() => setAreYouSure(true)}>
              <Trash />
            </Button>
          </span>
        </CardHeader>

        {/* Document Viewer Container */}
        <CardContent
          className="relative flex-1 p-0 bg-muted overflow-auto"
          style={isOfficeDoc ? { minHeight: "80vh" } : undefined}
        >
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
              height: "100%",
              width: "100%",
              minHeight: "700px",
            }}
          />
        </CardContent>

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
      </Card>
      <AreYouSure
        fileKey={data[currentIndex].fileKey}
        onChange={setAreYouSure}
        open={areYouSure}
      />
    </>
  );
}

function AreYouSure({
  fileKey,
  onChange,
  open,
}: {
  fileKey: string;
  open: boolean;
  onChange: (arg: boolean) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [lessonTypeParams] = useLessonTypeParams();

  const deleteFile = useMutation(
    trpc.admin.deleteLessonDocument.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.admin.getLessonDocument.queryOptions({
            lessonId: lessonTypeParams.id ?? -1,
          })
        );
        onChange(false);
        toast.success("Deleted Successfully");
      },
    })
  );

  return (
    <ResponsiveDialog
      title="Do you want to delete this file?"
      description="This will DELETE the file permanently"
      open={open}
      onOpenChange={onChange}
    >
      <div className="flex gap-5 my-3 mx-1">
        <Button
          className="flex-1"
          variant={"outline"}
          onClick={() => onChange(false)}
        >
          No
        </Button>
        <Button
          className="flex-1"
          variant={"destructive"}
          onClick={() => {
            deleteFile.mutate({ fileKey });
          }}
        >
          Yes
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
