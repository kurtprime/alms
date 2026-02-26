"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  ClipboardList,
  Trash2,
  Pencil,
  X,
  File,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import ResponsiveDialog from "@/components/responsive-dialog";
import { MDXRenderer } from "@/components/mdx-renderer";
import { cn } from "@/lib/utils";
import {
  typeConfig,
  statusConfig,
  type LessonTypeKey,
  buildInitialData,
} from "./types";
import { useDocumentViewer } from "./context";
import { AddLessonDialog } from "../Teacher/AddLessonDialog";
import Link from "next/link";

// Icon mapping for dynamic icon rendering
const iconMap = {
  FileText,
  HelpCircle,
  ClipboardList,
} as const;

// ============================================
// MOBILE DOCUMENT VIEWER
// ============================================

export function MobileDocumentSheet({
  classId,
  isTeacher,
}: {
  classId: string;
  isTeacher: boolean;
}) {
  const { activeItem, setActiveItem } = useDocumentViewer();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"content" | "files">("content");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: deleteLessonType, isPending } = useMutation(
    trpc.user.deleteLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
        );
        setActiveItem(null);
      },
    }),
  );

  React.useEffect(() => {
    setCurrentDocIndex(0);
    setViewMode("content");
  }, [activeItem?.id]);

  if (!activeItem) return null;

  const config = typeConfig[activeItem.type as LessonTypeKey];
  const Icon = config.icon;
  const hasContent = activeItem.serializedMarkup;
  const hasDocuments = activeItem.documents && activeItem.documents.length > 0;
  const documents = activeItem.documents || [];

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm truncate">
                {activeItem.name || `Untitled ${config.label}`}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {activeItem.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setActiveItem(null)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile View Tabs */}
        {hasContent && hasDocuments && (
          <div className="flex items-center gap-1 px-3 pb-2">
            <Button
              variant={viewMode === "content" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => setViewMode("content")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Content
            </Button>
            <Button
              variant={viewMode === "files" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => setViewMode("files")}
            >
              <Paperclip className="w-3 h-3 mr-1" />
              Files ({documents.length})
            </Button>
          </div>
        )}

        {/* Mobile Actions */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            {activeItem.status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 h-5 font-medium",
                  statusConfig[activeItem.status as keyof typeof statusConfig]
                    .className,
                )}
              >
                {
                  statusConfig[activeItem.status as keyof typeof statusConfig]
                    .label
                }
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {viewMode === "files" && hasDocuments && (
              <>
                <Button type="button" variant={"ghost"}>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={documents[currentDocIndex].fileUfsUrl ?? undefined}
                  >
                    <ExternalLink />
                  </a>
                </Button>
              </>
            )}
            {isTeacher ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-600"
                  onClick={() => setOpenEdit(true)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setOpenDelete(true)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Link href={`${classId}/${activeItem.type}/${activeItem.id}`}>
                  <Button variant={"ghost"}>view more</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "content" && (
          <ScrollArea className="h-full">
            <div className="p-4">
              {hasContent ? (
                <div className="prose prose-sm prose-slate max-w-none">
                  <MDXRenderer source={activeItem.serializedMarkup} />
                </div>
              ) : hasDocuments ? (
                <div className="text-center py-8">
                  <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-4">
                    No written content. {documents.length} file(s) attached.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("files")}
                  >
                    <Paperclip className="w-3 h-3 mr-1" />
                    View Files
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 text-sm">No content available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {viewMode === "files" && hasDocuments && (
          <div className="h-full flex flex-col">
            {/* Document Navigation */}
            {documents.length > 1 && (
              <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-slate-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentDocIndex(Math.max(0, currentDocIndex - 1))
                  }
                  disabled={currentDocIndex === 0}
                  className="h-7"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {currentDocIndex + 1} / {documents.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentDocIndex(
                      Math.min(documents.length - 1, currentDocIndex + 1),
                    )
                  }
                  disabled={currentDocIndex === documents.length - 1}
                  className="h-7"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            <div className="flex-1 min-h-0 bg-slate-50">
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
            </div>
          </div>
        )}

        {viewMode === "files" && !hasDocuments && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Paperclip className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm">No files attached</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ResponsiveDialog
        title="Delete Item"
        description={`Delete "${activeItem.name || "Untitled"}"? This cannot be undone.`}
        onOpenChange={setOpenDelete}
        open={openDelete}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDelete(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteLessonType({ lessonTypeId: activeItem.id })}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        title={`Edit ${config.label}`}
        open={openEdit}
        description=""
        variant="fullscreen"
        onOpenChange={setOpenEdit}
      >
        <AddLessonDialog
          initialData={buildInitialData(activeItem)}
          classId={classId}
          lessonType={activeItem.type}
          setOpen={setOpenEdit}
        />
      </ResponsiveDialog>

      <style jsx global>{`
        #react-doc-viewer iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 300px;
          border: none;
        }
        #react-doc-viewer .react-doc-viewer__renderer {
          height: 100% !important;
          min-height: 300px;
        }
      `}</style>
    </div>
  );
}
