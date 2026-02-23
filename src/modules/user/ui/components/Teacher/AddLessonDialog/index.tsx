"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import type { LessonTeacherData } from "./types";
import { LESSON_TYPE_CONFIG } from "./types";
import { AddLessonDialog } from "./add-lesson-dialog";

interface AddLessonBtnProps {
  classId: string;
}

export default function AddLessonBtn({ classId }: AddLessonBtnProps) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<LessonTeacherData>();
  const [lessonType, setLessonType] = useState<
    "handout" | "assignment" | "quiz"
  >("handout");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const lessonCreateType = useMutation(
    trpc.user.createLessonType.mutationOptions({
      onSuccess: (data, variables) => {
        if (!data) return;

        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({
            classId: variables.classId,
          }),
        );

        setLessonType(data.lessonTypeData.type);

        // Build data with type assertion
        const initialData = {
          lessonId: `${data.lessonData.id}`,
          lessonTypeId: data.lessonTypeData.id,
          title: data.lessonTypeData.name ?? "",
          markDownDescription: data.lessonTypeData.markup ?? "",
          lessonType: variables.lessonTypeEnum,
          ...("quizSetting" in data && { quizSettings: data.quizSetting }),
        } as LessonTeacherData;

        setInitialData(initialData);
        setOpen(true);
      },
    }),
  );

  const handleCreateLesson = (type: "handout" | "assignment" | "quiz") => {
    lessonCreateType.mutate({
      classId: classId,
      lessonTypeEnum: type,
    });
  };

  // Get lesson types from config
  const lessonTypes = Object.values(LESSON_TYPE_CONFIG);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            disabled={lessonCreateType.isPending}
          >
            {lessonCreateType.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <span>Create</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-2">
          <DropdownMenuGroup>
            {lessonTypes.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.type}
                  onClick={() => handleCreateLesson(item.type)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {initialData && (
        <ResponsiveDialog
          title={"Add " + lessonType}
          description=""
          open={open}
          variant="fullscreen"
          onOpenChange={setOpen}
        >
          <AddLessonDialog
            setOpen={setOpen}
            classId={classId}
            initialData={initialData}
            lessonType={lessonType}
          />
        </ResponsiveDialog>
      )}
    </>
  );
}

export { AddLessonDialog } from "./add-lesson-dialog";
export * from "./types";
