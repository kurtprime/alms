"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Pencil,
  X,
  Maximize2,
  Minimize2,
  File,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
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

// ============================================
// DOCUMENT VIEWER PANEL
// ============================================

export function DocumentViewerPanel({
  classId,
  isTeacher,
}: {
  classId: string;
  isTeacher: boolean;
}) {
  const { activeItem, setActiveItem, isFullscreen, toggleFullscreen } =
    useDocumentViewer();

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Document navigation state
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"content" | "files">("content");

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

  // Reset state when item changes
  React.useEffect(() => {
    setCurrentDocIndex(0);
    setViewMode("content");
  }, [activeItem?.id]);

  if (!activeItem) {
    return (
      <div className="hidden h-full lg:flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 border-l border-slate-200">
        <div className="text-center p-8 max-w-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <File className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Document Viewer
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a handout, quiz, or assignment to preview its contents here
          </p>
        </div>
      </div>
    );
  }

  const config = typeConfig[activeItem.type as LessonTypeKey];
  const Icon = config.icon;
  const hasContent = activeItem.serializedMarkup;
  const hasDocuments = activeItem.documents && activeItem.documents.length > 0;
  const documents = activeItem.documents || [];

  // Document navigation handlers
  const handlePrevDoc = () => {
    setCurrentDocIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextDoc = () => {
    setCurrentDocIndex((prev) => Math.min(documents.length - 1, prev + 1));
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex flex-col h-full bg-white border-l border-slate-200",
          isFullscreen && "fixed inset-0 z-50 w-full",
        )}
      >
        {/* Viewer Header */}
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
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-700"
                onClick={() => setActiveItem(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* View Mode Tabs - only show if both content and files exist */}
          {hasContent && hasDocuments && (
            <div className="flex items-center gap-1 px-3 pb-2">
              <Button
                variant={viewMode === "content" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewMode("content")}
              >
                <FileText className="w-3 h-3 mr-1" />
                Content
              </Button>
              <Button
                variant={viewMode === "files" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewMode("files")}
              >
                <Paperclip className="w-3 h-3 mr-1" />
                Files ({documents.length})
              </Button>
            </div>
          )}

          {/* Status & Actions Bar */}
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
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mr-1.5",
                      statusConfig[
                        activeItem.status as keyof typeof statusConfig
                      ].dot,
                    )}
                  />
                  {
                    statusConfig[activeItem.status as keyof typeof statusConfig]
                      .label
                  }
                </Badge>
              )}
              <span className="text-[11px] text-slate-500">
                {new Date(activeItem.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
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

        {/* Viewer Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* CONTENT VIEW */}
          {viewMode === "content" && (
            <ScrollArea className="flex-1">
              <div className="p-4">
                {hasContent ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <MDXRenderer source={activeItem.serializedMarkup} />
                  </div>
                ) : hasDocuments ? (
                  <div className="space-y-4">
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
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 text-sm">
                      No content available
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* FILES VIEW */}
          {viewMode === "files" && hasDocuments && (
            <>
              {/* Document Navigation */}
              {documents.length > 1 && (
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handlePrevDoc}
                    disabled={currentDocIndex === 0}
                    className="h-7"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {currentDocIndex + 1} / {documents.length}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleNextDoc}
                    disabled={currentDocIndex === documents.length - 1}
                    className="h-7"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Document Viewer */}
              <ScrollArea className="h-[calc(100vh-270px)]">
                <div className="flex-1 min-h-0 bg-slate-50">
                  <DocViewer
                    key={currentDocIndex}
                    documents={[
                      {
                        uri: documents[currentDocIndex].fileUrl,
                        fileName:
                          documents[currentDocIndex].name ||
                          `Document ${currentDocIndex + 1}`,
                        fileType:
                          documents[currentDocIndex].fileType || undefined,
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
              </ScrollArea>

              {/* Current File Info */}
              <div className="shrink-0 px-4 py-2 border-t bg-white">
                <p className="text-xs text-slate-600 truncate">
                  {documents[currentDocIndex].name ||
                    `Document ${currentDocIndex + 1}`}
                </p>
              </div>
            </>
          )}

          {/* NO FILES STATE */}
          {viewMode === "files" && !hasDocuments && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Paperclip className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm">No files attached</p>
                {hasContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setViewMode("content")}
                  >
                    View content instead
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Dialog */}
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

        {/* Edit Dialog */}
        <ResponsiveDialog
          title={`Edit ${config.label}`}
          open={openEdit}
          description=""
          variant="fullscreen"
          onOpenChange={setOpenEdit}
        >
          <ScrollArea className="max-h-[85vh]">
            <AddLessonDialog
              initialData={buildInitialData(activeItem)}
              classId={classId}
              lessonType={activeItem.type}
              setOpen={setOpenEdit}
            />
          </ScrollArea>
        </ResponsiveDialog>

        {/* Global styles for doc viewer */}
        <style jsx global>{`
          #react-doc-viewer iframe {
            width: 100% !important;
            height: 100% !important;
            min-height: 400px;
            border: none;
          }
          #react-doc-viewer .react-doc-viewer__renderer {
            height: 100% !important;
            min-height: 400px;
          }
          #react-doc-viewer > div {
            height: 100% !important;
            min-height: 400px;
          }
          #react-doc-viewer {
            height: 100% !important;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
