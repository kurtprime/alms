import { BookCopy } from "lucide-react";
import z from "zod";
import { addLessonTeacherSchema } from "@/modules/user/server/userSchema";

// Form data type
export type LessonTeacherData = z.infer<typeof addLessonTeacherSchema>;

// File configuration for validation
export type FileKey = "pdf" | "doc" | "docx" | "ppt" | "pptx";

export const FILE_CONFIG: Record<
  FileKey,
  { maxSize: number; label: string; color: string }
> = {
  pdf: { maxSize: 4 * 1024 * 1024, label: "PDF", color: "text-red-500" },
  doc: { maxSize: 8 * 1024 * 1024, label: "Word", color: "text-blue-500" },
  docx: { maxSize: 8 * 1024 * 1024, label: "Word", color: "text-blue-500" },
  ppt: {
    maxSize: 16 * 1024 * 1024,
    label: "PowerPoint",
    color: "text-orange-500",
  },
  pptx: {
    maxSize: 16 * 1024 * 1024,
    label: "PowerPoint",
    color: "text-orange-500",
  },
};

// Document type from API
export interface LessonDocument {
  fileUrl: string;
  id: number;
  name: string | null;
  lessonTypeId: number | null;
  fileHash: string | null;
  size: number | null;
  fileKey: string;
  fileUfsUrl: string | null;
  fileType: string | null;
  uploadedAt: string;
}

// Lesson types for the create menu
export const LESSON_TYPES = [
  {
    type: "handout",
    label: "Handout",
    icon: BookCopy,
    description: "Create learning materials",
  },
  {
    type: "assignment",
    label: "Assignment",
    icon: BookCopy,
    description: "Create assignments for students",
  },
  {
    type: "quiz",
    label: "Quiz",
    icon: BookCopy,
    description: "Create interactive quizzes",
  },
] as const;

// Utility functions
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() ?? "";
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown size";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
};
