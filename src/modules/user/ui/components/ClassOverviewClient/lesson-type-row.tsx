"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ChevronRight,
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
  Trophy,
  Shuffle,
  CheckCircle,
  AlertCircle,
  Timer,
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
import { format } from "date-fns";
import { useDocumentViewer } from "./context";
import { buildInitialData, LessonType } from "./types";
import { AddLessonDialog } from "../Teacher/AddLessonDialog";

// ============================================
// TYPES
// ============================================

interface QuizSettings {
  lessonTypeId: number;
  startDate: string | null;
  endDate: string | null;
  timeLimit: number | null;
  maxAttempts: number | null;
  shuffleQuestions: boolean | null;
  showScoreAfterSubmission: boolean | null;
  showCorrectAnswers: boolean | null;
}

interface AssignmentSettings {
  lessonTypeId: number;
  startDate: string | null;
  endDate: string | null;
  maxAttempts: number | null;
  score: number | null;
}

// ============================================
// CONFIG========================================

// ====
export const typeConfig = {
  handout: {
    label: "Handout",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  quiz: {
    label: "Quiz",
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  assignment: {
    label: "Assignment",
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
} as const;

export const statusConfig = {
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

type LessonTypeKey = keyof typeof typeConfig;

// ============================================
// HELPER COMPONENTS
// ============================================

function SettingBadge({
  icon: Icon,
  label,
  value,
  variant = "secondary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  variant?: "secondary" | "outline" | "default";
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={variant}
          className="text-[10px] px-1.5 py-0 h-5 font-medium gap-1"
        >
          <Icon className="w-2.5 h-2.5" />
          {value === 0 ? "no time limit" : value}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DateTimeBadge({
  date,
  label,
  variant = "outline",
}: {
  date: string | Date | null;
  label: string;
  variant?: "outline" | "secondary" | "default";
}) {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const isPast = dateObj < new Date();

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={variant}
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-medium gap-1",
            isPast && "text-orange-600 border-orange-200 bg-orange-50",
          )}
        >
          <Calendar className="w-2.5 h-2.5" />
          {format(dateObj, "MMM d")}
          <span className="text-muted-foreground font-normal">
            {format(dateObj, "h:mm a")}
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {format(dateObj, "MMM d, yyyy h:mm a")}
      </TooltipContent>
    </Tooltip>
  );
}

function BooleanIndicator({
  value,
  icon: Icon,
  label,
  activeColor = "text-green-600",
}: {
  value: boolean | null;
  icon: React.ElementType;
  label: string;
  activeColor?: string;
}) {
  if (!value) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Icon className={cn("w-3.5 h-3.5", activeColor)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function QuizSettingsBadges({ settings }: { settings: QuizSettings | null }) {
  if (!settings) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Time Limit */}
      {typeof settings.timeLimit === "number" && (
        <SettingBadge
          icon={Timer}
          label="Time Limit"
          value={
            settings.timeLimit ? `${settings.timeLimit}m` : "No time Limit"
          }
        />
      )}

      {/* Max Attempts */}
      {settings.maxAttempts && (
        <SettingBadge
          icon={RotateCcw}
          label="Max Attempts"
          value={
            settings.maxAttempts === 99
              ? "unlimited tries"
              : `${settings.maxAttempts} tries`
          }
        />
      )}

      {/* Due Date */}
      <DateTimeBadge date={settings.endDate} label="Due" />

      {/* Boolean Indicators */}
      <div className="flex items-center gap-1 ml-1">
        <BooleanIndicator
          value={settings.shuffleQuestions}
          icon={Shuffle}
          label="Shuffle Questions"
        />
        <BooleanIndicator
          value={settings.showScoreAfterSubmission}
          icon={CheckCircle}
          label="Show Score After Submit"
        />
        <BooleanIndicator
          value={settings.showCorrectAnswers}
          icon={Eye}
          label="Show Correct Answers"
          activeColor="text-blue-600"
        />
      </div>
    </div>
  );
}

function AssignmentSettingsBadges({
  settings,
}: {
  settings: AssignmentSettings | null;
}) {
  if (!settings) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Points/Score */}
      {settings.score && (
        <SettingBadge
          icon={Trophy}
          label="Points"
          value={`${settings.score} pts`}
          variant="default"
        />
      )}

      {/* Max Attempts */}
      {settings.maxAttempts && (
        <SettingBadge
          icon={RotateCcw}
          label="Max Attempts"
          value={
            settings.maxAttempts === 99
              ? "unlimited tries"
              : `${settings.maxAttempts} tries`
          }
        />
      )}

      {/* Due Date */}
      <DateTimeBadge date={settings.endDate} label="Due" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

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
        if (activeItem?.id === item.id) {
          setActiveItem(null);
        }
      },
    }),
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const config = typeConfig[item.type as LessonTypeKey];
  const Icon = config.icon;
  const isActive = activeItem?.id === item.id;
  const hasDocuments = item.documents && item.documents.length > 0;

  // Determine if due date is approaching or past
  const getDueDateStatus = () => {
    const settings =
      item.type === "quiz"
        ? item.quizSettings
        : item.type === "assignment"
          ? item.assignmentSettings
          : null;

    if (!settings?.endDate) return null;

    const dueDate = new Date(settings.endDate);
    const now = new Date();
    const hoursUntilDue =
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return "past";
    if (hoursUntilDue < 24) return "soon";
    return "upcoming";
  };

  const dueDateStatus = getDueDateStatus();

  const handleViewDocument = () => {
    if (!isViewerOpen) toggleViewer();
    setActiveItem(item);
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-start gap-2 py-2.5 px-2.5 rounded-lg cursor-pointer",
          "transition-all duration-150 ease-out",
          "hover:bg-slate-50",
          "border border-transparent",
          isActive && "bg-blue-50/50 border-blue-100",
          dueDateStatus === "past" && "opacity-60",
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
        <div className={cn("p-1.5 rounded-md shrink-0 mt-0.5", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 truncate text-sm">
              {item.name || `Untitled ${config.label}`}
            </h4>
            {item.status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-medium shrink-0",
                  statusConfig[item.status as keyof typeof statusConfig]
                    .className,
                )}
              >
                {statusConfig[item.status as keyof typeof statusConfig].label}
              </Badge>
            )}
          </div>

          {/* Settings Row - Type Specific */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Created Date */}
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3" />
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>

            {/* Documents Count */}
            {hasDocuments && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              >
                <Paperclip className="w-2.5 h-2.5 mr-1" />
                {item.documents!.length}
              </Badge>
            )}

            {/* Type-specific settings */}
            {item.type === "quiz" && (
              <QuizSettingsBadges settings={item.quizSettings} />
            )}
            {item.type === "assignment" && (
              <AssignmentSettingsBadges settings={item.assignmentSettings} />
            )}
          </div>

          {/* Due Date Warning */}
          {dueDateStatus === "soon" && (
            <div className="flex items-center gap-1 text-[11px] text-orange-600">
              <AlertCircle className="w-3 h-3" />
              <span>Due soon</span>
            </div>
          )}
          {dueDateStatus === "past" && (
            <div className="flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>Past due</span>
            </div>
          )}
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

      {/* Edit Dialog - Import your AddLessonDialog here */}
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
