"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  FileText,
  HelpCircle,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Pencil,
  Calendar,
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
import { UserGetAllLessonsWithContentsInClass } from "../../server/userSchema";
import ResponsiveDialog from "@/components/responsive-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Lesson = UserGetAllLessonsWithContentsInClass;
type LessonType = Lesson[number]["lessonTypes"];

const typeConfig = {
  handout: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Handout",
  },
  quiz: {
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Quiz",
  },
  assignment: {
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Assignment",
  },
} as const;

const statusConfig = {
  draft: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Draft",
  },
  published: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Live",
  },
  archived: {
    className: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Archived",
  },
};

function LessonTypeRow({
  item,
  classId,
}: {
  item: LessonType[number] & { lessonName?: string };
  classId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: deleteLessonType, isPending } = useMutation(
    trpc.user.deleteLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
        );
      },
    }),
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <>
      <AccordionItem
        className="relative border-none group/item"
        value={`${item.id}-${item.name}`}
      >
        {/* Actions - outside trigger, hover reveal */}
        <div
          className={cn(
            "absolute right-2 top-2.5 z-10 flex items-center gap-1",
            "opacity-0 group-hover/item:opacity-100",
            "transition-opacity duration-200",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-600 hover:text-slate-900 bg-white/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpenEdit(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 bg-white/80 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => e.stopPropagation()}
                className="text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDelete(true);
                }}
                className="text-xs text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trigger - clean, no nested buttons */}
        <AccordionTrigger
          className={cn(
            "flex items-center gap-3 py-2.5 px-3 rounded-lg w-full",
            "hover:bg-slate-50 transition-colors",
            "border border-transparent hover:border-slate-200",
            "hover:no-underline",
            "[&[data-state=open]>svg:last-child]:rotate-180",
          )}
        >
          {/* Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {config.label}
            </TooltipContent>
          </Tooltip>

          {/* Content */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900 truncate text-sm">
                  {item.name || `Untitled ${item.type}`}
                </h4>
                {item.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5 font-medium",
                      statusConfig[item.status].className,
                    )}
                  >
                    {statusConfig[item.status].label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Metadata - reserve space for actions with pr-20 */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 shrink-0 pr-20">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-1 pb-2">
          <div className="pl-9 pr-3 text-sm text-slate-600">{item.markup}</div>
        </AccordionContent>
      </AccordionItem>

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
        className="min-w-[90vw] max-w-[90vw] max-h-[85vh]"
        onOpenChange={setOpenEdit}
      >
        <AddLessonDialog
          initialData={{
            lessonId: `${item.lessonId}`,
            lessonTypeId: item.id,
            title: item.name ?? "",
            markDownDescription: item.markup ?? "",
          }}
          classId={classId}
          setOpen={setOpenEdit}
        />
      </ResponsiveDialog>
    </>
  );
}

function TopicSection({
  title,
  lessons,
  session,
  defaultOpen = true,
  classId,
}: {
  title: string;
  lessons: Lesson;
  session: Session;
  defaultOpen?: boolean;
  classId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isTeacher = session.user.role === "teacher";

  const items = lessons
    .flatMap((lesson) =>
      lesson.lessonTypes.map((lt) => ({
        ...lt,
        lessonName: lesson.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  if (items.length === 0 && !isTeacher) return null;

  return (
    <div className="mb-4">
      {/* Section Header - compact */}
      <div
        className={cn(
          "flex items-center justify-between py-2 px-2 rounded-md",
          "hover:bg-slate-100/50 transition-colors cursor-pointer",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-500 transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <h3 className="font-semibold text-slate-800 text-sm truncate">
            {title}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {items.length}
          </span>
        </div>

        {isTeacher && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Items - dense list */}
      {isOpen && (
        <div className="mt-1 ml-6 space-y-0.5">
          <Accordion type="multiple">
            {items.map((item) => (
              <LessonTypeRow key={item.id} item={item} classId={classId} />
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  isTeacher,
  classId,
}: {
  isTeacher: boolean;
  classId: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-slate-100 flex items-center justify-center">
        <ClipboardList className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-medium text-slate-900 mb-1">
        No content yet
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {isTeacher
          ? "Add your first handout, quiz, or assignment"
          : "Check back later for new content"}
      </p>
      {isTeacher && <AddLessonBtn classId={classId} />}
    </div>
  );
}

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
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Optional: Class header here */}

          <div className="space-y-1">
            {lessons.map((lesson) => (
              <TopicSection
                key={lesson.id}
                classId={classId}
                session={session}
                title={lesson.name}
                lessons={[lesson]}
              />
            ))}
          </div>

          {lessons.length === 0 && (
            <EmptyState isTeacher={isTeacher} classId={classId} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
