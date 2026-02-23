import { LucideIcon, BookCopy, ClipboardList, HelpCircle } from "lucide-react";
import {
  LessonType,
  LessonTeacherData,
  QuizSettings,
  AdminLessonDocument,
} from "@/modules/user/server/userSchema";

// ============================================
// RE-EXPORT TYPES FROM USER SCHEMA
// (for convenience - import from either file)
// ============================================
export type {
  LessonType,
  LessonTeacherData,
  QuizSettings,
} from "@/modules/user/server/userSchema";

// ============================================
// FILE CONFIGURATION
// ============================================
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

// ============================================
// DOCUMENT TYPE FROM API
// ============================================
export type LessonDocument = AdminLessonDocument;

// ============================================
// LESSON TYPE CONFIGURATION
// ============================================
export interface LessonTypeConfig {
  type: LessonType;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
}

export const LESSON_TYPE_CONFIG: Record<LessonType, LessonTypeConfig> = {
  handout: {
    type: "handout",
    label: "Handout",
    icon: BookCopy,
    description: "Create learning materials",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  assignment: {
    type: "assignment",
    label: "Assignment",
    icon: ClipboardList,
    description: "Create assignments for students",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  quiz: {
    type: "quiz",
    label: "Quiz",
    icon: HelpCircle,
    description: "Create interactive quizzes",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
} as const;

// Legacy array for backwards compatibility
export const LESSON_TYPES = Object.values(LESSON_TYPE_CONFIG);

// ============================================
// DIALOG PROPS
// ============================================
export interface BaseLessonDialogProps {
  classId: string;
  initialData: LessonTeacherData;
  setOpen: (arg: boolean) => void;
  lessonType: LessonType;
}

// ============================================
// FILE UPLOAD TYPES
// ============================================
export interface FileUploadState {
  files: File[];
  error: string | null;
  isUploading: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() ?? "";
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown size";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
};
