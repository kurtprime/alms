"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React, { useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  FileText,
  HelpCircle,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Pencil,
  Calendar,
  X,
  Maximize2,
  Minimize2,
  File,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Session } from "@/lib/auth-client";
import AddLessonBtn, { AddLessonDialog } from "./Teacher/AddLesson";
import ResponsiveDialog from "@/components/responsive-dialog";
import { MDXRenderer } from "@/components/mdx-renderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { UserGetAllLessonsWithContentsInClass } from "../../server/userSchema";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

// ============================================
// TYPES
// ============================================

type Lesson = UserGetAllLessonsWithContentsInClass;

type LessonDocument = Lesson[number]["lessonTypes"][number]["documents"];

type LessonType = Lesson[number]["lessonTypes"][number];

// ============================================
// TYPE CONFIGURATIONS
// ============================================
const typeConfig = {
  handout: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-l-blue-400",
    label: "Handout",
    gradient: "from-blue-500 to-blue-600",
  },
  quiz: {
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-l-purple-400",
    label: "Quiz",
    gradient: "from-purple-500 to-purple-600",
  },
  assignment: {
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-l-emerald-400",
    label: "Assignment",
    gradient: "from-emerald-500 to-emerald-600",
  },
} as const;

const statusConfig = {
  draft: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Draft",
    dot: "bg-amber-400",
  },
  published: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Live",
    dot: "bg-emerald-400",
  },
  archived: {
    className: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Archived",
    dot: "bg-slate-400",
  },
};

// ============================================
// DOCUMENT VIEWER CONTEXT
// ============================================
type ViewerItem = LessonType;

interface DocumentViewerContextType {
  activeItem: ViewerItem | null;
  setActiveItem: (item: ViewerItem | null) => void;
  isViewerOpen: boolean;
  toggleViewer: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const DocumentViewerContext =
  React.createContext<DocumentViewerContextType | null>(null);

function useDocumentViewer() {
  const context = React.useContext(DocumentViewerContext);
  if (!context) {
    throw new Error(
      "useDocumentViewer must be used within DocumentViewerProvider",
    );
  }
  return context;
}

function DocumentViewerProvider({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState<ViewerItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleViewer = useCallback(() => setIsViewerOpen((prev) => !prev), []);
  const toggleFullscreen = useCallback(
    () => setIsFullscreen((prev) => !prev),
    [],
  );

  return (
    <DocumentViewerContext.Provider
      value={{
        activeItem,
        setActiveItem,
        isViewerOpen,
        toggleViewer,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </DocumentViewerContext.Provider>
  );
}

// ============================================
// DOCUMENT VIEWER PANEL
// ============================================
function DocumentViewerPanel({
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
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 border-l border-slate-200">
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

  const config = typeConfig[activeItem.type];
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
                <config.icon className={cn("w-4 h-4", config.color)} />
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
                    statusConfig[activeItem.status].className,
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mr-1.5",
                      statusConfig[activeItem.status].dot,
                    )}
                  />
                  {statusConfig[activeItem.status].label}
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
              {hasDocuments && viewMode === "files" && (
                <Button type="button" variant={"ghost"}>
                  <a href={documents[currentDocIndex].fileUrl}>
                    Open in a new Tab
                  </a>
                </Button>
              )}

              {isTeacher && (
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
              )}
            </div>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* CONTENT VIEW */}
          {viewMode === "content" && (
            <ScrollArea className="max-h-[90vh]">
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
              <ScrollArea className="max-h-[80vh]">
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
              initialData={{
                lessonId: `${activeItem.lessonId}`,
                lessonTypeId: activeItem.id,
                title: activeItem.name ?? "",
                markDownDescription: activeItem.markup ?? "",
              }}
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

// ============================================
// LESSON TYPE ROW
// ============================================
function LessonTypeRow({
  item,
  lessonName,
  classId,
  isTeacher,
}: {
  item: LessonType;
  lessonName: string;
  classId: string;
  isTeacher: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { activeItem, setActiveItem, toggleViewer, isViewerOpen } =
    useDocumentViewer();

  const { mutate: deleteLessonType, isPending } = useMutation(
    trpc.user.deleteLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
        );
        if (activeItem?.id === item.id) {
          setActiveItem(null);
        }
      },
    }),
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const config = typeConfig[item.type];
  const Icon = config.icon;
  const isActive = activeItem?.id === item.id;
  const hasDocuments = item.documents && item.documents.length > 0;

  const handleViewDocument = () => {
    if (!isViewerOpen) toggleViewer();
    setActiveItem({
      id: item.id,
      name: item.name,
      type: item.type,
      status: item.status,
      serializedMarkup: item.serializedMarkup,
      markup: item.markup,
      createdAt: item.createdAt,
      lessonId: item.lessonId,
      documents: item.documents,
    });
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer",
          "transition-all duration-150 ease-out",
          "hover:bg-slate-50",
          "border border-transparent",
          isActive && "bg-blue-50/50 border-blue-100",
        )}
        onClick={handleViewDocument}
      >
        {/* Left accent bar */}
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full",
            "transition-all duration-150",
            isActive
              ? "bg-blue-400"
              : "bg-transparent group-hover:bg-slate-300",
          )}
        />

        {/* Icon */}
        <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 truncate text-sm">
              {item.name || `Untitled ${config.label}`}
            </h4>
            {item.status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-medium shrink-0",
                  statusConfig[item.status].className,
                )}
              >
                {statusConfig[item.status].label}
              </Badge>
            )}
            {hasDocuments && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                  >
                    <Paperclip className="w-2.5 h-2.5 mr-1" />
                    {item.documents!.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {item.documents!.length} file(s) attached
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-0.5 shrink-0",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {isTeacher && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    onClick={() => setOpenEdit(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="text-xs">
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setOpenDelete(true)}
                    className="text-xs text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* View indicator for large screens */}
        <div className="hidden lg:flex items-center">
          <ChevronRight
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-150",
              isActive && "rotate-180 text-blue-500",
            )}
          />
        </div>
      </div>

      {/* Delete Dialog */}
      <ResponsiveDialog
        title="Delete Item"
        description={`Delete "${item.name || "Untitled"}"? This cannot be undone.`}
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
            onClick={() => deleteLessonType({ lessonTypeId: item.id })}
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
            initialData={{
              lessonId: `${item.lessonId}`,
              lessonTypeId: item.id,
              title: item.name ?? "",
              markDownDescription: item.markup ?? "",
            }}
            classId={classId}
            lessonType={item.type}
            setOpen={setOpenEdit}
          />
        </ScrollArea>
      </ResponsiveDialog>
    </>
  );
}

// ============================================
// TOPIC SECTION
// ============================================
function TopicSection({
  lesson,
  session,
  defaultOpen = true,
  classId,
}: {
  lesson: Lesson[number];
  session: Session;
  defaultOpen?: boolean;
  classId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isTeacher = session.user.role === "teacher";

  const items = lesson.lessonTypes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (items.length === 0 && !isTeacher) return null;

  return (
    <div className="mb-3">
      {/* Section Header */}
      <div
        className={cn(
          "w-full flex items-center justify-between py-2 px-2 rounded-md",
          "hover:bg-slate-50 transition-colors",
          "cursor-pointer select-none",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <h3 className="font-semibold text-slate-700 text-sm truncate">
            {lesson.name}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        </div>

        {isTeacher && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Items */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
              {items.map((item) => (
                <LessonTypeRow
                  key={item.id}
                  item={item}
                  lessonName={lesson.name}
                  classId={classId}
                  isTeacher={isTeacher}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({
  isTeacher,
  classId,
}: {
  isTeacher: boolean;
  classId: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center">
        <ClipboardList className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        No content yet
      </h3>
      <p className="text-sm text-slate-500 mb-5 text-center max-w-xs">
        {isTeacher
          ? "Start building your course by adding handouts, quizzes, or assignments"
          : "Check back soon for new learning materials"}
      </p>
      {isTeacher && <AddLessonBtn classId={classId} />}
    </div>
  );
}

// ============================================
// MOBILE DOCUMENT VIEWER
// ============================================
function MobileDocumentSheet({
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

  const config = typeConfig[activeItem.type];
  const hasContent = activeItem.serializedMarkup;
  const hasDocuments = activeItem.documents && activeItem.documents.length > 0;
  const documents = activeItem.documents || [];

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white mt-5">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
              <config.icon className={cn("w-4 h-4", config.color)} />
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
                  statusConfig[activeItem.status].className,
                )}
              >
                {statusConfig[activeItem.status].label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {viewMode === "files" && hasDocuments && (
              <Button type="button" variant={"ghost"}>
                <a target="_blank" href={documents[currentDocIndex].fileUrl}>
                  Open
                </a>
              </Button>
            )}
            {isTeacher && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setOpenEdit(true)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setOpenDelete(true)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "content" && (
          <ScrollArea className="max-h-[80vh]">
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
            <ScrollArea className="max-h-[80vh] max-w-screen">
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
          initialData={{
            lessonId: `${activeItem.lessonId}`,
            lessonTypeId: activeItem.id,
            title: activeItem.name ?? "",
            markDownDescription: activeItem.markup ?? "",
          }}
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

// ============================================
// VIEWER TOGGLE BUTTON
// ============================================
function ViewerToggle() {
  const { isViewerOpen, toggleViewer } = useDocumentViewer();

  return (
    <div className="hidden lg:flex items-center justify-end mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleViewer}
        className="h-8 text-xs text-slate-600"
      >
        {isViewerOpen ? (
          <>
            <PanelRightClose className="w-3.5 h-3.5 mr-1.5" />
            Hide Viewer
          </>
        ) : (
          <>
            <PanelRightOpen className="w-3.5 h-3.5 mr-1.5" />
            Show Viewer
          </>
        )}
      </Button>
    </div>
  );
}

// ============================================
// RESIZABLE CONTENT WRAPPER
// ============================================
function ResizableContent({
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
  const isMobile = useIsMobile();

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full">
      {/* Left Panel - Lesson List */}
      <ResizablePanel defaultSize={isViewerOpen ? 60 : 100} minSize={30}>
        <div className=" overflow-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
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
      {isViewerOpen && !isMobile && (
        <ResizableHandle
          withHandle
          className="bg-slate-200 min-h-[85vh] hover:bg-blue-400 transition-colors"
        />
      )}

      {/* Right Panel - Document Viewer */}
      {isViewerOpen && !isMobile && (
        <ResizablePanel defaultSize={40} minSize={25} maxSize={70}>
          <DocumentViewerPanel isTeacher={isTeacher} classId={classId} />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ClassOverviewClient({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
  );

  const lessons = data as Lesson;
  const isTeacher = session.user.role === "teacher";

  return (
    <DocumentViewerProvider>
      <TooltipProvider delayDuration={300}>
        <div className="bg-background">
          <ResizableContent
            classId={classId}
            isTeacher={isTeacher}
            lessons={lessons}
            session={session}
          />
          {/* Mobile Document Viewer */}
          <MobileDocumentSheet classId={classId} isTeacher={isTeacher} />
        </div>
      </TooltipProvider>
    </DocumentViewerProvider>
  );
}
