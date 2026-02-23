"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { UploadCloud, Loader2, X, FileText, AlertCircle } from "lucide-react";
import { FILE_CONFIG, FileKey, getFileExtension } from "./types";

interface FileUploadSectionProps {
  files: File[];
  error: string | null;
  isUploading: boolean;
  isDragActive: boolean;
  getRootProps: <T extends Record<string, unknown>>(
    props?: T,
  ) => T & React.HTMLAttributes<HTMLElement>;
  getInputProps: <T extends Record<string, unknown>>(
    props?: T,
  ) => T & React.InputHTMLAttributes<HTMLInputElement>;
  onUpload: () => Promise<void>;
  onRemoveFile: (index: number) => void;
}

// File icon helper
function getFileIcon(ext: string) {
  const config = FILE_CONFIG[ext as FileKey];
  return (
    <FileText className={cn("h-5 w-5", config?.color ?? "text-gray-500")} />
  );
}

export function FileUploadSection({
  files,
  error,
  isUploading,
  isDragActive,
  getRootProps,
  getInputProps,
  onUpload,
  onRemoveFile,
}: FileUploadSectionProps) {
  return (
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
            isDragActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-sm font-medium mb-1">
          {isDragActive ? "Drop files here" : "Drag & drop or click to browse"}
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
            const ext = getFileExtension(file.name) as FileKey;
            const config = FILE_CONFIG[ext];
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-background border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(ext)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {config?.label}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button
            onClick={onUpload}
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
                Upload {files.length} file{files.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
