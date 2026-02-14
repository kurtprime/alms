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
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  FileUp,
  Plus,
  Loader2,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  ExternalLink,
  Trash2,
  FileIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import CreateLessonLeftSide from "@/modules/admin/ui/subject/components/CreateLessonLeftSide";
import { Input } from "@/components/ui/input";
import { MdxEditor } from "@/services/mdxEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaveStatusBadge } from "@/modules/admin/ui/subject/components/QuizQuestionTypes/MultipleChoiceQuestion";
import { useAutoSaveLesson } from "@/modules/user/hooks/use-auto-save";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useDropzone, Accept, FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { addLessonTeacherSchema } from "@/modules/user/server/userSchema";
import {
  FILE_CONFIG,
  FileKey,
  formatDate,
  formatFileSize,
  getFileExtension,
  LessonDocument,
  LessonTeacherData,
} from "@/modules/user/types/addLesson";
import LessonSelect from "./LessonSelect";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface AddLessonDialogProps {
  classId: string;
  initialData: LessonTeacherData;
  setOpen: (arg: boolean) => void;
  lessonType: string;
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

  const form = useForm({
    resolver: zodResolver(addLessonTeacherSchema),
    defaultValues: {
      lessonId: `${lessonId}`,
      lessonTypeId: lessonTypeId,
      title: title ?? "",
      markDownDescription: markDownDescription ?? "",
    },
  });

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

  const formValues = useWatch({
    control: form.control,
  });
  const isDirty = form.formState.isDirty;

  const { isSaving, errorMessage } = useAutoSaveLesson({
    data: {
      ...formValues,
    } as LessonTeacherData,
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
  });

  const [openAddNewLesson, setOpenAddNewLesson] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lessonTypeParams = { id: initialData.lessonTypeId };

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<LessonDocument | null>(
    null,
  );

  // Fetch uploaded documents
  const { data: uploadedDocs, isPending: isLoadingDocs } = useQuery(
    trpc.admin.getLessonDocument.queryOptions({
      lessonId: lessonTypeId ?? lessonTypeParams.id ?? -1,
    }),
  );

  const { startUpload, isUploading } = useUploadThing(
    "documentLessonUploader",
    {
      onClientUploadComplete: () => {
        toast.success("Uploaded Successfully");
        queryClient.invalidateQueries(
          trpc.admin.getLessonDocument.queryOptions({
            lessonId: lessonTypeId ?? lessonTypeParams.id ?? -1,
          }),
        );
        setFiles([]);
        setError(null);
      },
      onUploadError: (error) => {
        console.error("Upload failed:", error);
        setError(error.message);
      },
    },
  );

  const accept: Accept = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "application/msword": [".doc"],
    "application/vnd.ms-powerpoint": [".ppt"],
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = file.name.split(".").pop()?.toLowerCase() as FileKey;

    if (!ext || !FILE_CONFIG[ext]) {
      return { valid: false, error: `Unsupported file type: ${file.type}` };
    }

    const config = FILE_CONFIG[ext];
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / 1024 / 1024;
      return {
        valid: false,
        error: `${file.name} exceeds ${maxSizeMB}MB limit`,
      };
    }

    return { valid: true };
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        setError("Invalid file type. Please check accepted formats.");
        return;
      }

      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      acceptedFiles.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          validationErrors.push(validation.error!);
        }
      });

      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "));
      }

      const maxFiles = 5;
      const finalFiles = [...files, ...validFiles].slice(0, maxFiles);

      if (validFiles.length > maxFiles - files.length) {
        setError(`Maximum ${maxFiles} files allowed.`);
      }

      setFiles(finalFiles);
    },
    [files],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 5,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!lessonTypeId && !lessonTypeParams?.id) {
      toast.error("Cannot upload files at this time");
      return;
    }
    await startUpload(files, {
      lessonId: lessonTypeId ?? lessonTypeParams.id!,
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (ext: string) => {
    const config = FILE_CONFIG[ext as FileKey];
    return (
      <FileText className={cn("h-5 w-5", config?.color ?? "text-gray-500")} />
    );
  };

  function onSubmit(data: LessonTeacherData) {
    mutate({ ...data, status: "published" });
  }

  const uploadedCount = uploadedDocs?.length ?? 0;
  const totalCount = files.length + uploadedCount;

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
                <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter a title..."
                            className="border-0 bg-transparent text-2xl font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {lessonType}
                    </Badge>
                    <SaveStatusBadge
                      isSaving={isSaving}
                      isDirty={isDirty}
                      error={errorMessage}
                    />
                  </div>
                </div>

                {/* Tabs for Content/Settings */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <div className="flex-shrink-0 border-b px-6">
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
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {totalCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="content"
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <div className="p-6">
                      <FormField
                        control={form.control}
                        name="markDownDescription"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-medium text-muted-foreground">
                              Instructions
                            </FormLabel>
                            <ScrollArea className="h-full max-h-[50vh]">
                              <FormControl>
                                <div className="rounded-lg border">
                                  <MdxEditor
                                    className="min-h-[400px] "
                                    value={field.value}
                                    onChange={field.onChange}
                                    lessonTypeId={formValues.lessonTypeId}
                                  />
                                </div>
                              </FormControl>
                            </ScrollArea>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="attachments"
                    className="m-0 min-h-0 flex-1 overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        {/* Upload Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Upload Files
                            </h3>
                            <div className="flex gap-1.5">
                              <Badge variant="outline" className="text-xs">
                                PDF
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                DOC
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                PPT
                              </Badge>
                            </div>
                          </div>

                          {/* Dropzone */}
                          <div
                            {...getRootProps()}
                            className={cn(
                              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
                              isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25",
                              isUploading && "opacity-60 pointer-events-none",
                            )}
                          >
                            <input {...getInputProps()} />
                            <UploadCloud
                              className={cn(
                                "h-8 w-8 mx-auto mb-2",
                                isDragActive
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                            />
                            <p className="text-sm font-medium mb-1">
                              {isDragActive
                                ? "Drop files here"
                                : "Drag & drop or click to browse"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Max 5 files, up to 16MB each
                            </p>
                          </div>

                          {/* Error Alert */}
                          {error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}

                          {/* Selected Files */}
                          {files.length > 0 && (
                            <div className="space-y-2">
                              {files.map((file, index) => {
                                const ext = getFileExtension(
                                  file.name,
                                ) as FileKey;
                                const config = FILE_CONFIG[ext];
                                return (
                                  <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between p-3 bg-background border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {getFileIcon(ext)}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                          MB • {config?.label}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeFile(index)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                              <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full"
                                size="sm"
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Upload {files.length} file
                                    {files.length > 1 ? "s" : ""}
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Uploaded Files Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Uploaded Files
                            </h3>
                            {uploadedCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {uploadedCount} file
                                {uploadedCount > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>

                          {isLoadingDocs ? (
                            <div className="space-y-2">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="h-16 bg-muted rounded-lg animate-pulse"
                                />
                              ))}
                            </div>
                          ) : uploadedDocs && uploadedDocs.length > 0 ? (
                            <div className="space-y-2">
                              {uploadedDocs.map((doc: LessonDocument) => {
                                const ext = getFileExtension(
                                  doc.name || "",
                                ) as FileKey;
                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {getFileIcon(ext)}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {doc.name || `Document ${doc.id}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatFileSize(doc.size)} •{" "}
                                          {formatDate(doc.uploadedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                          window.open(doc.fileUrl, "_blank")
                                        }
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        title="Open in new tab"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => setDeleteConfirm(doc)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/10">
                              <FileIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No files uploaded yet
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                Upload files using the area above
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right side - Settings sidebar */}
              <div className="hidden w-80 flex-shrink-0 overflow-y-auto bg-muted/20 lg:block">
                <div className="p-6">
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-base">Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-0">
                      {/* Lesson Select */}
                      <FormField
                        control={form.control}
                        name="lessonId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Lesson
                            </FormLabel>
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

                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <FormLabel className="text-sm font-medium">
                          Quick Actions
                        </FormLabel>
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => setOpenAddNewLesson(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Create New Lesson
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex flex-shrink-0 items-center justify-between border-t bg-background px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Mobile: Show files tab shortcut */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 lg:hidden"
                  onClick={() => setActiveTab("attachments")}
                >
                  <FileUp className="h-4 w-4" />
                  Files
                  {totalCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.reset()}
                  disabled={isPending}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!form.formState.isValid || isPending}
                  className="gap-2 min-w-[100px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        doc={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        lessonTypeId={lessonTypeId ?? lessonTypeParams.id}
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
