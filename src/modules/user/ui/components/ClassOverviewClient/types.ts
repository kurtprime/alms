import { FileText, HelpCircle, ClipboardList, LucideIcon } from "lucide-react";
import {
  defaultAssignmentSettings,
  defaultQuizSettings,
  UserGetAllLessonsWithContentsInClass,
} from "@/modules/user/server/userSchema";

// ============================================
// TYPES
// ============================================

export type Lesson = UserGetAllLessonsWithContentsInClass;

export type LessonDocument = Lesson[number]["lessonTypes"][number]["documents"];

export type LessonType = Lesson[number]["lessonTypes"][number];

export type ViewerItem = LessonType;

// ============================================
// LESSON TYPE CONFIGURATIONS
// ============================================

export type LessonTypeKey = "handout" | "quiz" | "assignment";

export interface LessonTypeConfigItem {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  label: string;
  gradient: string;
}

export const typeConfig: Record<LessonTypeKey, LessonTypeConfigItem> = {
  handout: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-l-blue-400",
    label: "Handout",
    gradient: "from-blue-500 to-blue-600",
  },
  quiz: {
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-l-purple-400",
    label: "Quiz",
    gradient: "from-purple-500 to-purple-600",
  },
  assignment: {
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-l-emerald-400",
    label: "Assignment",
    gradient: "from-emerald-500 to-emerald-600",
  },
};

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export type StatusKey = "draft" | "published" | "archived";

export interface StatusConfigItem {
  className: string;
  label: string;
  dot: string;
}

export const statusConfig: Record<StatusKey, StatusConfigItem> = {
  draft: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Draft",
    dot: "bg-amber-400",
  },
  published: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Live",
    dot: "bg-emerald-400",
  },
  archived: {
    className: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Archived",
    dot: "bg-slate-400",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

import type { LessonTeacherData } from "@/modules/user/server/userSchema";

/**
 * Builds initial data for the edit dialog from a ViewerItem
 */
export function buildInitialData(item: ViewerItem): LessonTeacherData {
  const base = {
    lessonId: `${item.lessonId}`,
    lessonTypeId: item.id,
    title: item.name ?? "",
    markDownDescription: item.markup ?? "",
  };

  const type = item.type as LessonTypeKey;
  const quizSetting = item.quizSettings;
  const assignmentSetting = item.assignmentSettings;

  if (type === "handout") {
    return {
      ...base,
      lessonType: "handout",
    };
  }

  if (type === "quiz") {
    return {
      ...base,
      lessonType: "quiz",
      quizSettings: {
        quizId: quizSetting?.quizId ?? defaultQuizSettings.quizId,
        timeLimit: quizSetting?.timeLimit ?? defaultQuizSettings.timeLimit,
        maxAttempts:
          quizSetting?.maxAttempts ?? defaultQuizSettings.maxAttempts,
        shuffleQuestions:
          quizSetting?.shuffleQuestions ?? defaultQuizSettings.shuffleQuestions,
        showScoreAfterSubmission:
          quizSetting?.showScoreAfterSubmission ??
          defaultQuizSettings.showScoreAfterSubmission,
        showCorrectAnswers:
          quizSetting?.showCorrectAnswers ??
          defaultQuizSettings.showCorrectAnswers,
        startDate: quizSetting?.startDate
          ? new Date(quizSetting.startDate)
          : defaultQuizSettings.startDate,
        endDate: quizSetting?.endDate
          ? new Date(quizSetting.endDate)
          : defaultQuizSettings.endDate,
      },
    };
  }

  if (type === "assignment") {
    return {
      ...base,
      lessonType: "assignment",
      quizSettings: {
        maxAttempts:
          assignmentSetting?.maxAttempts ??
          defaultAssignmentSettings.maxAttempts,
        scores: assignmentSetting?.score ?? defaultAssignmentSettings.scores,
        startDate: assignmentSetting?.startDate
          ? new Date(assignmentSetting?.startDate)
          : null,
        endDate: assignmentSetting?.endDate
          ? new Date(assignmentSetting?.endDate)
          : null,
      },
    };
  }

  throw new Error(`Unknown lesson type: ${type}`);
}
