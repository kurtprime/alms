"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import CreateLessonLeftSide from "@/modules/admin/ui/subject/components/CreateLessonLeftSide";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MdxEditor } from "@/services/mdxEditor";
import {
  lessonTeacherSchema,
  getDefaultLessonValues,
  hasQuizSettings,
  LessonType,
} from "@/modules/user/server/userSchema";
import { useAutoSaveLesson } from "@/modules/user/hooks/use-auto-save";
import { LessonTeacherData, LessonDocument } from "./types";
import { useFileUpload } from "./use-file-upload";
import { TitleSection } from "./title-section";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { FileUploadSection } from "./file-upload-section";
import { FormFooter } from "./form-footer";
import { SettingsSidebar } from "./settings-sidebar";
import { UploadedFilesList } from "./uploaded-files-list";
import { lessonTypeEnum } from "@/db/schema";
import { QuizSelector } from "./quiz-selector";

// ============================================
// MAIN COMPONENT
// ============================================
interface AddLessonDialogProps {
  classId: string;
  initialData: LessonTeacherData;
  setOpen: (arg: boolean) => void;
  lessonType: (typeof lessonTypeEnum)["enumValues"][number];
}

export function AddLessonDialog({
  classId,
  initialData,
  setOpen,
  lessonType,
}: AddLessonDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { lessonId, lessonTypeId, title, markDownDescription } = initialData;
  const isQuiz = lessonType === "quiz";

  const defaultValues = useMemo((): LessonTeacherData => {
    const defaults = getDefaultLessonValues(lessonType as LessonType);
    const merged = {
      ...defaults,
      lessonId: `${lessonId}`,
      lessonTypeId: lessonTypeId,
      title: title ?? "",
      markDownDescription: markDownDescription ?? "",
    };
    if (hasQuizSettings(initialData) && initialData.quizSettings) {
      return {
        ...merged,
        quizSettings: initialData.quizSettings,
      } as LessonTeacherData;
    }
    return merged;
  }, [
    lessonType,
    lessonId,
    lessonTypeId,
    title,
    markDownDescription,
    initialData,
  ]);

  const form = useForm<LessonTeacherData>({
    resolver: zodResolver(lessonTeacherSchema),
    defaultValues,
    mode: "onChange",
  });

  // Use useWatch for reactive values compatible with React Compiler
  const formValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  const { mutate, isPending } = useMutation(
    trpc.user.updateLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
        );
        setOpen(false);
      },
    }),
  );

  const { isSaving, errorMessage } = useAutoSaveLesson({
    data: formValues as LessonTeacherData,
    enabled: isDirty,
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId }),
      );
      form.reset(form.getValues(), { keepValues: true, keepDirty: false });
    },
    interval: 3,
    classId,
  });

  const [activeTab, setActiveTab] = useState("content");
  const [deleteConfirm, setDeleteConfirm] = useState<
    LessonDocument[number] | null
  >(null);
  const [openAddNewLesson, setOpenAddNewLesson] = useState(false);

  const {
    files,
    error,
    isUploading,
    isLoadingDocs,
    uploadedDocs,
    totalCount,
    handleUpload,
    removeFile,
    getRootProps,
    getInputProps,
    isDragActive,
  } = useFileUpload({
    lessonTypeId: lessonTypeId ?? initialData.lessonTypeId,
    maxFiles: 5,
  });

  function onSubmit(data: LessonTeacherData) {
    mutate({ ...data, status: "published", classId });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left side */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r">
                <TitleSection
                  form={form}
                  lessonType={lessonType}
                  isSaving={isSaving}
                  isDirty={isDirty}
                  errorMessage={errorMessage}
                />

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <div className="shrink-0 border-b px-6">
                    <TabsList className="h-12 bg-transparent p-0">
                      <TabsTrigger
                        value="content"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                      >
                        {isQuiz ? "Quiz Setup" : "Content"}
                      </TabsTrigger>

                      {/* Hide Attachments tab for Quiz type */}
                      {!isQuiz && (
                        <TabsTrigger
                          value="attachments"
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                          Attachments
                          {totalCount > 0 && (
                            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                              {totalCount}
                            </span>
                          )}
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  {/* Content Tab */}
                  <TabsContent
                    value="content"
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        {/* QUIZ SPECIFIC UI */}
                        {isQuiz && (
                          <FormField
                            control={form.control}
                            name="quizSettings.quizId"
                            render={({ field }) => (
                              <FormItem>
                                <QuizSelector
                                  value={field.value ?? null}
                                  onChange={field.onChange}
                                  classId={classId}
                                  lessonTypeId={lessonTypeId}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Markdown Editor */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-muted-foreground">
                            {isQuiz ? "Quiz Instructions" : "Lesson Content"}
                          </label>
                          <div className="rounded-lg border">
                            <MdxEditor
                              className="min-h-[300px]"
                              // FIX: Use formValues derived from useWatch instead of form.watch
                              value={formValues?.markDownDescription ?? ""}
                              onChange={(val) =>
                                form.setValue("markDownDescription", val)
                              }
                              lessonTypeId={formValues?.lessonTypeId}
                            />
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Attachments Tab (Hidden for Quiz) */}
                  {!isQuiz && (
                    <TabsContent
                      value="attachments"
                      className="m-0 min-h-0 flex-1 overflow-hidden"
                    >
                      <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                          <FileUploadSection
                            files={files}
                            error={error}
                            isUploading={isUploading}
                            isDragActive={isDragActive}
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            onUpload={handleUpload}
                            onRemoveFile={removeFile}
                          />
                          <Separator />
                          <UploadedFilesList
                            documents={uploadedDocs}
                            isLoading={isLoadingDocs}
                            onDeleteRequest={setDeleteConfirm}
                          />
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              {/* Right Sidebar */}
              <SettingsSidebar
                lessonType={lessonType}
                form={form}
                classId={classId}
                onOpenAddNewLesson={setOpenAddNewLesson}
              />
            </div>

            <FormFooter
              isPending={isPending}
              isValid={isValid}
              totalCount={totalCount}
              onReset={() => form.reset()}
              onCancel={() => setOpen(false)}
              onShowFiles={() => !isQuiz && setActiveTab("attachments")}
            />
          </form>
        </Form>
      </div>

      <DeleteConfirmDialog
        doc={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        lessonTypeId={lessonTypeId ?? initialData.lessonTypeId}
      />

      <ResponsiveDialog
        open={openAddNewLesson}
        onOpenChange={setOpenAddNewLesson}
        description=""
        title="Create Lesson"
      >
        <CreateLessonLeftSide onOpen={setOpenAddNewLesson} classId={classId} />
      </ResponsiveDialog>
    </div>
  );
}
