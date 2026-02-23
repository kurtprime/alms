"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2, FileIcon, FileText } from "lucide-react";
import {
  LessonDocument,
  FILE_CONFIG,
  FileKey,
  getFileExtension,
  formatFileSize,
  formatDate,
} from "./types";

interface UploadedFilesListProps {
  documents: LessonDocument | undefined;
  isLoading: boolean;
  onDeleteRequest: (doc: LessonDocument[number]) => void;
}

// File icon helper
function getFileIcon(ext: string) {
  const config = FILE_CONFIG[ext as FileKey];
  return (
    <FileText className={cn("h-5 w-5", config?.color ?? "text-gray-500")} />
  );
}

export function UploadedFilesList({
  documents,
  isLoading,
  onDeleteRequest,
}: UploadedFilesListProps) {
  const uploadedCount = documents?.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Uploaded Files
        </h3>
        {uploadedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {uploadedCount} file{uploadedCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => {
            const ext = getFileExtension(doc.name || "") as FileKey;
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
                      {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => onDeleteRequest(doc)}
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
          <p className="text-sm text-muted-foreground">No files uploaded yet</p>
          <p className="text-xs text-muted-foreground/70">
            Upload files using the area above
          </p>
        </div>
      )}
    </div>
  );
}
