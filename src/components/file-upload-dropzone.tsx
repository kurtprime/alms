"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, File, X, Loader2 } from "lucide-react";
import { useUploadThing } from "@/services/uploadthing/uploadthing";
import { toast } from "sonner";

interface FileUploadDropzoneProps {
  endpoint: "assignmentSubmissionUploader";
  input: {
    lessonTypeId: number;
    quizId: number;
    attemptNumber: number;
  };
  onUploadComplete?: () => void;
}

export function FileUploadDropzone({
  endpoint,
  input,
  onUploadComplete,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // CHANGE: State is now an array of files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Setup the UploadThing hook
  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: () => {
      setUploadProgress(100);
      toast.success("All files uploaded successfully");
      setSelectedFiles([]); // Clear all files
      setUploadProgress(0);
      onUploadComplete?.();
    },
    onUploadError: (error) => {
      setUploadProgress(0);
      toast.error(error.message);
    },
    onUploadBegin: () => {
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  // 2. Handle File Selection (Multiple)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files)); // Convert FileList to Array
    }
  };

  const handleUploadClick = () => {
    if (selectedFiles.length === 0) return;
    // UploadThing accepts an array of files
    startUpload(selectedFiles, input);
  };

  // Remove specific file from list
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Handle Drag & Drop Logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-slate-300 dark:border-slate-700 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple // IMPORTANT: Allow multiple file selection
        />

        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <Upload
            className={cn(
              "w-10 h-10 mb-3 transition-colors",
              isDragging ? "text-primary" : "text-slate-400",
            )}
          />
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-slate-400">
            PDF, DOCX, PPTX, Images or ZIP (MAX. 32MB)
          </p>
        </div>
      </div>

      {/* Selected Files Preview List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500">
            {selectedFiles.length} file(s) selected
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded bg-slate-50 dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <File className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium truncate max-w-[180px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar (Shared for batch) */}
          {isUploading && (
            <div className="space-y-1 pt-2">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-right text-slate-500">
                {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Action Button */}
      {selectedFiles.length > 0 && (
        <Button
          className="w-full"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            `Submit ${selectedFiles.length} File(s)`
          )}
        </Button>
      )}
    </div>
  );
}
