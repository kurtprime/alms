"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo, useEffect } from "react";
import {
  MoreHorizontal,
  FileText,
  HelpCircle,
  ClipboardList,
  Trash2,
  Copy,
  Pencil,
  Calendar,
  Eye,
  Paperclip,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Timer,
  Trophy,
  ChevronRight,
  Circle,
  Check,
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ResponsiveDialog from "@/components/responsive-dialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useDocumentViewer } from "./context";
import { buildInitialData, LessonType } from "./types";
import { AddLessonDialog } from "../Teacher/AddLessonDialog";
import Link from "next/link";

// Types & Config
type LessonTypeKey = "handout" | "quiz" | "assignment";

const typeConfig = {
  handout: {
    label: "Handout",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  quiz: {
    label: "Quiz",
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  assignment: {
    label: "Assignment",
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
} as const;

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  published: {
    label: "Published",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
} as const;

// Hook for current time (Pure)
function useNow(interval = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export function LessonTypeRow({
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
        if (activeItem?.id === item.id) setActiveItem(null);
      },
    }),
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const config = typeConfig[item.type as LessonTypeKey];
  const Icon = config.icon;
  const isActive = activeItem?.id === item.id;
  const hasDocuments = item.documents && item.documents.length > 0;

  // === MOCK DATA FOR UI VISUALIZATION ===
  // In a real app, this would come from item.isCompleted passed via props
  const [isCompleted, setIsCompleted] = useState(false);

  // Date Logic (Safe)
  const now = useNow();
  const endDateString =
    item.type === "quiz"
      ? item.quizSettings?.endDate
      : item.assignmentSettings?.endDate;

  const dueDate = useMemo(() => {
    return endDateString ? new Date(endDateString) : null;
  }, [endDateString]);

  const { isPastDue, isDueSoon, formattedDate } = useMemo(() => {
    if (!dueDate)
      return { isPastDue: false, isDueSoon: false, formattedDate: null };
    const dueTime = dueDate.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const past = dueTime < now;
    const soon = !past && dueTime - now < twentyFourHours;
    return {
      isPastDue: past,
      isDueSoon: soon,
      formattedDate: formatDistanceToNow(dueDate, { addSuffix: true }),
    };
  }, [dueDate, now]);

  const handleClick = () => {
    if (!isViewerOpen) toggleViewer();
    setActiveItem(item);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "group relative flex items-stretch rounded-xl cursor-pointer transition-all duration-200",
          "border bg-white hover:shadow-md hover:border-slate-200",
          isActive && "ring-2 ring-blue-500 border-blue-200 shadow-sm",
          isPastDue && !isTeacher && "opacity-60 hover:opacity-100",
        )}
      >
        {/* Left Status Strip */}
        <div
          className={cn(
            "w-1.5 rounded-l-xl flex-shrink-0 transition-colors",
            isCompleted
              ? "bg-green-500"
              : "bg-slate-200 group-hover:bg-slate-300",
          )}
        />

        <div className="flex-1 flex items-center gap-4 p-3 min-w-0">
          {/* Type Icon */}
          <div className={cn("p-2.5 rounded-lg shrink-0", config.bg)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800 truncate text-sm">
                {item.name || `Untitled ${config.label}`}
              </h4>

              {/* Completion Badge for Students */}
              {!isTeacher && isCompleted && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                >
                  Completed
                </Badge>
              )}

              {item.status && isTeacher && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 h-5 font-medium shrink-0 capitalize",
                    statusConfig[item.status as keyof typeof statusConfig]
                      .className,
                  )}
                >
                  {statusConfig[item.status as keyof typeof statusConfig].label}
                </Badge>
              )}
            </div>

            {/* Meta Info Row */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(item.createdAt), "MMM d")}
              </span>

              {hasDocuments && (
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  {item.documents!.length} files
                </span>
              )}

              {item.type === "quiz" && item.quizSettings?.timeLimit && (
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  {item.quizSettings.timeLimit} min
                </span>
              )}

              {item.type === "assignment" && item.assignmentSettings?.score && (
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  {item.assignmentSettings.score} pts
                </span>
              )}

              {dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    isPastDue && "text-red-500 font-medium",
                    isDueSoon && "text-amber-600 font-medium",
                  )}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isPastDue ? "Closed" : formattedDate}
                </span>
              )}
            </div>
          </div>

          {/* Right Action Area */}
          {/* Stop propagation to prevent card click when interacting with buttons */}
          <div
            className="flex items-center gap-1 shrink-0 pr-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isTeacher ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" /> Preview as Student
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setOpenDelete(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                {/* Show Mark as Done for Handouts to Students */}

                {/* View Button for Quizzes/Assignments */}
                <Link href={`${classId}/${item.type}/${item.id}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ResponsiveDialog
        title="Delete Item"
        description={`Delete "${item.name || "Untitled"}"? This cannot be undone.`}
        onOpenChange={setOpenDelete}
        open={openDelete}
      >
        <div className="flex justify-end gap-2 pt-4">
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

      <ResponsiveDialog
        title={`Edit ${config.label}`}
        open={openEdit}
        description=""
        variant="fullscreen"
        onOpenChange={setOpenEdit}
      >
        <AddLessonDialog
          initialData={buildInitialData(item)}
          classId={classId}
          lessonType={item.type}
          setOpen={setOpenEdit}
        />
      </ResponsiveDialog>
    </>
  );
}
