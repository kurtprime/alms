import { FILE_CONFIG } from "@/modules/admin/constants";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { useDropzone, Accept, FileRejection } from "react-dropzone";
import React from "react";
import { useState, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ResponsiveDialog from "@/components/responsive-dialog";
import { toast } from "sonner";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import { DocumentViewer } from "@/services/fileViewer/DocumentViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import MdxEditorForm from "./MdxEditorForm";
import { Spinner } from "@/components/ui/spinner";

export default function LessonTopic() {
  const [openDropZone, setOpenDropZone] = useState(false);
  const [lessonTypeParams] = useLessonTypeParams();
  const trpc = useTRPC();

  const { data, isPending, isError } = useQuery(
    trpc.admin.getMarkUp.queryOptions({ id: lessonTypeParams.id ?? -1 })
  );

  if (isError) {
    return <div>Error loading content.</div>;
  }

  return (
    <div className="flex flex-col gap-2 pr-3 pt-2 pl-1 ">
      <Button className="ml-auto" onClick={() => setOpenDropZone(true)}>
        Add File
      </Button>
      <DocumentViewer />
      <Card className="p-2 bg-background">
        {isPending ? (
          <div className="flex items-center justify-center h-48">
            <Spinner />
          </div>
        ) : (
          <MdxEditorForm key={lessonTypeParams.id} markup={data} />
        )}
      </Card>
      <ResponsiveDialog
        title=""
        description=""
        className="sm:max-w-200 p-0 pb-5"
        open={openDropZone}
        onOpenChange={setOpenDropZone}
      >
        <CustomDocumentDropzone setOpenChange={setOpenDropZone} />
      </ResponsiveDialog>
    </div>
  );
}

type FileKey = keyof typeof FILE_CONFIG;

export function CustomDocumentDropzone({
  setOpenChange,
}: {
  setOpenChange: (arg0: boolean) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lessonTypeParams] = useLessonTypeParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { startUpload, isUploading } = useUploadThing(
    "documentLessonUploader",
    {
      onClientUploadComplete: (res) => {
        toast.success("Uploaded Successfully");
        setOpenChange(false);
        queryClient.invalidateQueries(
          trpc.admin.getLessonDocument.queryOptions({
            lessonId: lessonTypeParams.id ?? -1,
          })
        );
        setFiles([]);
        setError(null);
      },
      onUploadError: (error) => {
        console.error("Upload failed:", error);
        setError(error.message);
      },
    }
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
      const finalFiles = validFiles.slice(0, maxFiles);

      if (validFiles.length > maxFiles) {
        setError(
          `Maximum ${maxFiles} files allowed. Only first ${maxFiles} were selected.`
        );
      }

      setFiles(finalFiles);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 5,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!lessonTypeParams?.id) return toast.error("Cannot do this action");
    await startUpload(files, { lessonId: lessonTypeParams.id });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "ppt":
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Upload Documents
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200
            ${
              isDragActive
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25"
            }
            ${isUploading ? "opacity-60 pointer-events-none" : ""}
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud
            className={`h-12 w-12 mx-auto mb-4 ${
              isDragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-lg font-medium mb-2">
            {isDragActive
              ? "Drop here to upload"
              : "Drag & drop documents here"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Or click to browse files
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
            <Badge variant="secondary">PDF (4MB)</Badge>
            <Badge variant="secondary">DOC/DOCX (8MB)</Badge>
            <Badge variant="secondary">PPT/PPTX (16MB)</Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {files.length === 0 && !error && !isUploading && (
          <Alert className="flex items-center gap-2 border-blue-200 bg-blue-50 text-blue-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Ready to upload documents</AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {files.length > 0 && !isUploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Selected Documents
              </h3>
              <Badge variant="outline">
                {files.length} file{files.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => {
                const ext = file.name
                  .split(".")
                  .pop()
                  ?.toLowerCase() as FileKey;
                const config = FILE_CONFIG[ext];
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(ext)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {config?.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {/* Upload Button */}
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} Document${files.length > 1 ? "s" : ""}`
            )}
          </Button>
        )}

        {/* Uploading State */}
        {isUploading && (
          <Alert className="flex items-center gap-2 border-blue-200 bg-blue-50 text-blue-700 w-full">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Upload in progress... Please wait
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
