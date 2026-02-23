"use client";

import { useState, useCallback } from "react";
import { useDropzone, Accept, FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  FILE_CONFIG,
  FileKey,
  FileValidationResult,
  LessonDocument,
} from "./types";

// ============================================
// ACCEPTED FILE TYPES
// ============================================
export const FILE_ACCEPT_TYPES: Accept = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/msword": [".doc"],
  "application/vnd.ms-powerpoint": [".ppt"],
};

// ============================================
// FILE UPLOAD HOOK
// ============================================
interface UseFileUploadOptions {
  lessonTypeId: number | null;
  maxFiles?: number;
}

interface UseFileUploadReturn {
  // State
  files: File[];
  error: string | null;
  isUploading: boolean;
  isLoadingDocs: boolean;
  uploadedDocs: LessonDocument | undefined;

  // Counts
  uploadedCount: number;
  totalCount: number;

  // Actions
  handleUpload: () => Promise<void>;
  removeFile: (index: number) => void;
  clearError: () => void;

  // Dropzone
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
}

export function useFileUpload({
  lessonTypeId,
  maxFiles = 5,
}: UseFileUploadOptions): UseFileUploadReturn {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Local state
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch uploaded documents
  const { data: uploadedDocs, isPending: isLoadingDocs } = useQuery(
    trpc.admin.getLessonDocument.queryOptions({
      lessonId: lessonTypeId ?? -1,
    }),
  );

  // Upload thing hook
  const { startUpload, isUploading } = useUploadThing(
    "documentLessonUploader",
    {
      onClientUploadComplete: () => {
        toast.success("Uploaded Successfully");
        queryClient.invalidateQueries(
          trpc.admin.getLessonDocument.queryOptions({
            lessonId: lessonTypeId ?? -1,
          }),
        );
        setFiles([]);
        setError(null);
      },
      onUploadError: (err) => {
        console.error("Upload failed:", err);
        setError(err.message);
      },
    },
  );

  // File validation
  const validateFile = (file: File): FileValidationResult => {
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

  // Drop handler
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
        } else if (validation.error) {
          validationErrors.push(validation.error);
        }
      });

      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "));
      }

      const finalFiles = [...files, ...validFiles].slice(0, maxFiles);

      if (validFiles.length > maxFiles - files.length) {
        setError(`Maximum ${maxFiles} files allowed.`);
      }

      setFiles(finalFiles);
    },
    [files, maxFiles],
  );

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FILE_ACCEPT_TYPES,
    maxFiles,
    disabled: isUploading,
  });

  // Upload handler
  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!lessonTypeId) {
      toast.error("Cannot upload files at this time");
      return;
    }
    await startUpload(files, { lessonId: lessonTypeId });
  };

  // Remove file from queue
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Clear error
  const clearError = () => setError(null);

  // Counts
  const uploadedCount = uploadedDocs?.length ?? 0;
  const totalCount = files.length + uploadedCount;

  return {
    files,
    error,
    isUploading,
    isLoadingDocs,
    uploadedDocs,
    uploadedCount,
    totalCount,
    handleUpload,
    removeFile,
    clearError,
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
