"use client";

import { FileUploadDropzone } from "@/components/file-upload-dropzone";

interface AssignmentUploaderProps {
  lessonTypeId: number;
  quizId: number;
  onSuccess?: () => void;
  attemptNumber: number;
}

export function AssignmentUploader({
  lessonTypeId,
  onSuccess,
  quizId,
  attemptNumber,
}: AssignmentUploaderProps) {
  return (
    <div className="w-full">
      <FileUploadDropzone
        endpoint="assignmentSubmissionUploader"
        input={{ lessonTypeId, quizId, attemptNumber }}
        onUploadComplete={onSuccess}
      />
    </div>
  );
}
