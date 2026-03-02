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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
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

export function DocumentViewerPanel({
  classId,
  isTeacher,
}: {
  classId: string;
  isTeacher: boolean;
}) {
  const {
    activeItem,
    setActiveItem,
    isFullscreen,
    toggleFullscreen,
    toggleViewer,
  } = useDocumentViewer();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);

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
  }, [activeItem?.id]);

  if (!activeItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 border-l text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border flex items-center justify-center mb-6">
          <File className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Select a Document
        </h3>
        <p className="text-sm text-slate-500 max-w-[200px]">
          Click on any handout, quiz, or assignment to preview it here.
        </p>
      </div>
    );
  }

  const config = typeConfig[activeItem.type as LessonTypeKey];
  const Icon = config.icon;
  const hasContent = activeItem.serializedMarkup;
  const documents = activeItem.documents || [];
  const hasDocuments = documents.length > 0;

  const handlePrevDoc = () =>
    setCurrentDocIndex(Math.max(0, currentDocIndex - 1));
  const handleNextDoc = () =>
    setCurrentDocIndex(Math.min(documents.length - 1, currentDocIndex + 1));

  // Default tab logic
  const defaultTab = hasContent ? "content" : "files";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex flex-col h-full bg-white border-l",
        isFullscreen && "fixed inset-0 z-50 w-full",
      )}
    >
      {/* Header */}
      <div className="shrink-0 border-b bg-white">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 truncate">
                {activeItem.name || `Untitled`}
              </h3>
              <p className="text-xs text-slate-500">{config.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setActiveItem(null);
                toggleViewer();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-3 pb-2 border-t pt-2">
          <Badge variant="outline" className="font-normal">
            {activeItem.status
              ? statusConfig[activeItem.status as keyof typeof statusConfig]
                  .label
              : "N/A"}
          </Badge>
          <div className="flex gap-1">
            {isTeacher ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setOpenEdit(true)}
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-600"
                  onClick={() => setOpenDelete(true)}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </>
            ) : (
              <Link href={`${classId}/${activeItem.type}/${activeItem.id}`}>
                <Button size="sm" className="h-7 text-xs">
                  View Full Page <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="flex-1 min-h-0">
        {hasContent && hasDocuments ? (
          <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
            <div className="border-b bg-slate-50 px-3">
              <TabsList className="h-9">
                <TabsTrigger value="content" className="text-xs px-3">
                  Content
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs px-3">
                  Files ({documents.length})
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="content" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-6 prose prose-sm max-w-none">
                  <MDXRenderer source={activeItem.serializedMarkup} />
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent
              value="files"
              className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
            >
              {/* File Viewer Logic (Same as before) */}
              <div className="h-full flex flex-col">
                {documents.length > 1 && (
                  <div className="flex items-center justify-between p-2 border-b bg-slate-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevDoc}
                      disabled={currentDocIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <span className="text-xs text-slate-500 font-medium">
                      {currentDocIndex + 1} / {documents.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextDoc}
                      disabled={currentDocIndex === documents.length - 1}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 min-h-0 bg-slate-50">
                  <DocViewer
                    key={currentDocIndex}
                    documents={[{ uri: documents[currentDocIndex].fileUrl }]}
                    pluginRenderers={DocViewerRenderers}
                    config={{ header: { disableHeader: true } }}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Single view mode (Only content OR files)
          <div className="h-full">
            {hasContent && (
              <ScrollArea className="h-full">
                <div className="p-6 prose prose-sm max-w-none">
                  <MDXRenderer source={activeItem.serializedMarkup} />
                </div>
              </ScrollArea>
            )}
            {hasDocuments && (
              // Render file viewer directly (simplified for brevity, use logic from above)
              <div className="h-full flex flex-col">
                {/* Include DocViewer logic here similar to files tab */}
                <div className="flex-1 min-h-0">
                  <DocViewer
                    key={currentDocIndex}
                    documents={[{ uri: documents[currentDocIndex].fileUrl }]}
                    pluginRenderers={DocViewerRenderers}
                    config={{ header: { disableHeader: true } }}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              </div>
            )}
            {!hasContent && !hasDocuments && (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <File className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No content available</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ResponsiveDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Confirm Delete"
        description="Are you sure?"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDelete(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteLessonType({ lessonTypeId: activeItem.id })}
          >
            Delete
          </Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        title="Edit"
        variant="fullscreen"
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
      `}</style>
    </motion.div>
  );
}
