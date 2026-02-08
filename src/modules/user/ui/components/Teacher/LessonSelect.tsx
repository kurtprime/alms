"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LessonCreate from "@/modules/admin/ui/subject/components/LessonLeftSide";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, Loader2, Plus } from "lucide-react";
import React from "react";

interface LessonSelectProps {
  classId: string;
  onLessonChange?: (lessonId: string) => void;
  defaultValue: string | null;
  setOpenAddNewLesson: (arg1: boolean) => void;
}

export default function LessonSelect({
  classId,
  onLessonChange,
  defaultValue,
  setOpenAddNewLesson,
}: LessonSelectProps) {
  const trpc = useTRPC();
  const {
    data: lessons,
    isPending,
    error,
  } = useQuery(trpc.user.getAllLessonsInClass.queryOptions({ classId }));

  // Error state
  if (error) {
    return (
      <div className="w-full rounded-lg border border-destructive/50 bg-destructive/10 p-4 lg:p-6">
        <p className="text-sm text-destructive lg:text-base">
          Failed to load lessons. Please try again.
        </p>
      </div>
    );
  }

  // Loading state
  if (isPending) {
    return <LessonSelectSkeleton />;
  }

  return (
    <Select
      defaultValue={defaultValue ?? undefined}
      onValueChange={onLessonChange}
    >
      <SelectTrigger className="w-full max-w-md g:max-w-lg xl:max-w-xl gap-2 border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring lg:h-16 lg:px-6 lg:py-4 lg:text-lg">
        <SelectValue
          placeholder={
            <span className="text-muted-foreground">Select a lesson</span>
          }
        />
      </SelectTrigger>

      <SelectContent className="max-h-96 w-full lg:max-h-[32rem]">
        <SelectGroup>
          <SelectLabel className="px-2 py-1.5 text-sm font-semibold lg:px-3 lg:py-2 lg:text-base">
            Available Lessons ({lessons.length})
          </SelectLabel>
          {!lessons || (lessons.length === 0 && <div>Lesson is Empty</div>)}
          {lessons.map((lesson) => (
            <SelectItem
              key={lesson.id}
              value={`${lesson.id}`}
              className="cursor-pointer px-2 py-2.5 text-sm focus:bg-accent focus:text-accent-foreground lg:px-3 lg:py-3.5 lg:text-base"
            >
              <div className="flex justify-center items-center gap-1.5 lg:gap-1">
                <span className="font-medium">{lesson.name}</span>
                <span className="text-xs ml-4 text-muted-foreground capitalize lg:text-sm">
                  {lesson.terms?.replace(/-/g, " ")}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
        <Button onClick={() => setOpenAddNewLesson(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Lesson
        </Button>
      </SelectContent>
    </Select>
  );
}

// Loading skeleton component
function LessonSelectSkeleton() {
  return (
    <div className="w-full space-y-2">
      <Skeleton className="h-10 w-full lg:h-16" />
    </div>
  );
}

// Full page loading variant (optional export)
export function LessonSelectFullLoading() {
  return (
    <div className="w-full space-y-3 rounded-lg border border-muted p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary lg:h-6 lg:w-6" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 lg:h-5 lg:w-40" />
          <Skeleton className="h-3 w-24 lg:h-4 lg:w-32" />
        </div>
      </div>
    </div>
  );
}
