"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  addLessonTeacherSchema,
  UserAddLessonType,
} from "@/modules/user/server/userSchema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { BookCopy, Plus } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import LessonSelect from "./LessonSelect";
import CreateLessonLeftSide from "@/modules/admin/ui/subject/components/CreateLessonLeftSide";
import { Input } from "@/components/ui/input";
import { MdxEditor } from "@/services/mdxEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AddLessonBtn({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<UserAddLessonType>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const lessonCreateType = useMutation(
    trpc.user.createLessonType.mutationOptions({
      onSuccess: (data, variables) => {
        //
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({
            classId: variables.classId,
          }),
        );
        setInitialData(data);
        setOpen(true);
      },
    }),
  );
  return (
    <>
      <DropdownMenu>
        <div className="md:w-110 lg:w-150 mt-5">
          <DropdownMenuTrigger disabled={lessonCreateType.isPending} asChild>
            <Button className="text-lg px-3 py-2">
              <Plus className="size-5" />
              Create
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="start" className="w-33">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                lessonCreateType.mutate({
                  classId: classId,
                  lessonTypeEnum: "handout",
                });
              }}
            >
              <BookCopy /> Handout
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookCopy /> Assignment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookCopy /> Quiz
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        title="Add Lesson"
        description=""
        open={open}
        className="min-w-[90vw] max-w-[90vw] min-h-[90vh] max-h-[90vh] flex flex-col justify-stretch items-stretch gap-3"
        onOpenChange={setOpen}
      >
        <AddLessonDialog classId={classId} initialData={initialData} />
      </ResponsiveDialog>
    </>
  );
}

function AddLessonDialog({
  classId,
  initialData,
}: {
  classId: string;
  initialData?: UserAddLessonType;
}) {
  type LessonTeacherData = z.infer<typeof addLessonTeacherSchema>;
  const form = useForm({
    resolver: zodResolver(addLessonTeacherSchema),
    defaultValues: {
      lessonId: "",
      title: "",
      markDownDescription: "",
    },
  });

  const [openAddNewLesson, setOpenAddNewLesson] = useState(false);

  function onSubmit(data: LessonTeacherData) {
    console.log(data);
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full h-full  flex flex-col lg:flex-row gap-6"
        >
          {/* Left side - Main content */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Title"
                      className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description/Instructions Field */}
            <FormField
              control={form.control}
              name="markDownDescription"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm text-muted-foreground font-normal">
                    Instructions (optional)
                  </FormLabel>
                  <FormControl>
                    <ScrollArea className="h-[50vh]">
                      <MdxEditor
                        className="min-h-[300px] border rounded-md  lg:prose-sm!"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </ScrollArea>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Attachments Section */}
          </div>

          {/* Right side - Settings sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <Card className="h-full">
              <CardContent className="p-4 space-y-4">
                {/* Lesson Select */}
                <FormField
                  control={form.control}
                  name="lessonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">For</FormLabel>
                      <FormControl>
                        <LessonSelect
                          classId={classId}
                          onLessonChange={field.onChange}
                          defaultValue={field.value}
                          setOpenAddNewLesson={setOpenAddNewLesson}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>

      {/* Submit button fixed at bottom */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid}
        >
          Create
        </Button>
      </div>

      <ResponsiveDialog
        open={openAddNewLesson}
        onOpenChange={setOpenAddNewLesson}
        description=""
        title="Create Lesson"
      >
        <CreateLessonLeftSide onOpen={setOpenAddNewLesson} classId={classId} />
      </ResponsiveDialog>
    </>
  );
}
