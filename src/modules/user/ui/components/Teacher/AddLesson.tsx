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
import {
  LESSON_TYPES,
  LessonTeacherData,
} from "@/modules/user/types/addLesson";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { AddLessonDialog } from "./AddLessonDialog";

interface AddLessonBtnProps {
  classId: string;
}

export default function AddLessonBtn({ classId }: AddLessonBtnProps) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<LessonTeacherData>();
  const [lessonType, setLessonType] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const lessonCreateType = useMutation(
    trpc.user.createLessonType.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({
            classId: variables.classId,
          }),
        );
        setLessonType(data.lessonTypeData.type);
        setInitialData({
          lessonId: `${data.lessonData.id}`,
          lessonTypeId: data.lessonTypeData.id,
          title: data.lessonTypeData.name ?? "",
          markDownDescription: data.lessonTypeData.markup ?? "",
        });
        setOpen(true);
      },
    }),
  );

  const handleCreateLesson = (type: string) => {
    lessonCreateType.mutate({
      classId: classId,
      lessonTypeEnum: type as "handout" | "assignment" | "quiz",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="gap-2  shadow-sm hover:shadow-md transition-shadow"
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
            {LESSON_TYPES.map((item) => (
              <DropdownMenuItem
                key={item.type}
                onClick={() => handleCreateLesson(item.type)}
                className="flex items-center gap-3 p-3 cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
          initialData={initialData!}
          lessonType={lessonType}
        />
      </ResponsiveDialog>
    </>
  );
}

// Re-export the dialog for external use
export { AddLessonDialog } from "./AddLessonDialog";
