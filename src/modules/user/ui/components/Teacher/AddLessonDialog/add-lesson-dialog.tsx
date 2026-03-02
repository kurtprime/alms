"use client";

import ResponsiveDialog from "@/components/responsive-dialog";
import { Form, FormField } from "@/components/ui/form";
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

  // ============================================
  // DEFAULT VALUES - Always include lessonType
  // ============================================
  const defaultValues = useMemo((): LessonTeacherData => {
    // Get base defaults from factory
    const defaults = getDefaultLessonValues(lessonType as LessonType);

    // Merge with initial data
    const merged = {
      ...defaults,
      lessonId: `${lessonId}`,
      lessonTypeId: lessonTypeId,
      title: title ?? "",
      markDownDescription: markDownDescription ?? "",
    };

    // Preserve quizSettings if it exists in initialData
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

  // ============================================
  // FORM SETUP - Use explicit generic type
  // ============================================
  const form = useForm<LessonTeacherData>({
    resolver: zodResolver(lessonTeacherSchema),
    defaultValues,
    mode: "onChange",
  });

  // Form state
  const formValues = useWatch({
    control: form.control,
  });
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  // Mutations
  const { mutate, isPending } = useMutation(
    trpc.user.updateLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getAllLessonsWithContentsInClass.queryOptions({
            classId,
          }),
        );
        setOpen(false);
      },
    }),
  );

  // Auto-save
  const { isSaving, errorMessage } = useAutoSaveLesson({
    data: formValues as LessonTeacherData,
    enabled: isDirty,
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.user.getAllLessonsWithContentsInClass.queryOptions({
          classId,
        }),
      );
      form.reset(form.getValues(), {
        keepValues: true,
        keepDirty: false,
      });
    },
    interval: 3,
    classId,
  });

  // UI state
  const [openAddNewLesson, setOpenAddNewLesson] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [deleteConfirm, setDeleteConfirm] = useState<
    LessonDocument[number] | null
  >(null);

  // File upload hook
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

  // Form submit
  function onSubmit(data: LessonTeacherData) {
    mutate({ ...data, status: "published", classId });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Left side - Main content */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r">
                {/* Title Section */}
                <TitleSection
                  form={form}
                  lessonType={lessonType}
                  isSaving={isSaving}
                  isDirty={isDirty}
                  errorMessage={errorMessage}
                />

                {/* Tabs for Content/Settings */}
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
                        Content
                      </TabsTrigger>
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
                    </TabsList>
                  </div>

                  {/* Content Tab */}
                  <TabsContent
                    value="content"
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <div className="p-6">
                      <FormField
                        control={form.control}
                        name="markDownDescription"
                        render={({ field }) => (
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">
                              Instructions
                            </label>
                            <ScrollArea className="h-full max-h-[50vh]">
                              <div className="rounded-lg border">
                                <MdxEditor
                                  className="min-h-[400px]"
                                  value={field.value}
                                  onChange={field.onChange}
                                  lessonTypeId={formValues.lessonTypeId}
                                />
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Attachments Tab */}
                  <TabsContent
                    value="attachments"
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        {/* File Upload Section */}
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

                        {/* Uploaded Files List */}
                        <UploadedFilesList
                          documents={uploadedDocs}
                          isLoading={isLoadingDocs}
                          onDeleteRequest={setDeleteConfirm}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right side - Settings sidebar */}
              <SettingsSidebar
                lessonType={lessonType}
                form={form}
                classId={classId}
                onOpenAddNewLesson={setOpenAddNewLesson}
              />
            </div>

            {/* Fixed Footer */}
            <FormFooter
              isPending={isPending}
              isValid={isValid}
              totalCount={totalCount}
              onReset={() => form.reset()}
              onCancel={() => setOpen(false)}
              onShowFiles={() => setActiveTab("attachments")}
            />
          </form>
        </Form>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        doc={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        lessonTypeId={lessonTypeId ?? initialData.lessonTypeId}
      />

      {/* Create Lesson Dialog */}
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
