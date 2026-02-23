import { lessonTypeEnum } from "@/db/schema";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import z from "zod";

// ============================================
// LESSON TYPE
// ============================================
export type LessonType = (typeof lessonTypeEnum.enumValues)[number];

// ============================================
// DATE SCHEMA - Handles string/Date/null/undefined
// ============================================
const dateSchema = z
  .custom<Date | null | undefined>(
    (val) => {
      if (val === null || val === undefined) return true;
      if (val instanceof Date) return true;
      if (typeof val === "string") return !isNaN(new Date(val).getTime());
      if (typeof val === "number") return true;
      return false;
    },
    { message: "Invalid date" },
  )
  .optional();

// ============================================
// QUIZ SETTINGS SCHEMA
// ============================================
export const quizSettingsSchema = z.object({
  timeLimit: z.number().int().min(0),
  maxAttempts: z.number().int().min(1).optional(),
  shuffleQuestions: z.boolean(),
  showScoreAfterSubmission: z.boolean(),
  showCorrectAnswers: z.boolean(),
  startDate: dateSchema,
  endDate: dateSchema,
});

// ============================================
// ASSIGNMENT SETTINGS SCHEMA
// ============================================
const assignmentSettingsSchema = z.object({
  maxAttempts: z.number().int().min(1).optional(),
  scores: z.number().int().min(0),
  startDate: dateSchema,
  endDate: dateSchema,
});

export type QuizSettings = z.infer<typeof quizSettingsSchema>;
export type AssignmentSettings = z.infer<typeof assignmentSettingsSchema>;

// ============================================
// BASE LESSON SCHEMA
// ============================================
const baseLessonSchema = z.object({
  lessonId: z.string(),
  lessonTypeId: z.number().int(),
  title: z.string().min(1, "Title is required"),
  markDownDescription: z.string(),
});

// ============================================
// INDIVIDUAL LESSON SCHEMAS
// ============================================
const handoutSchema = baseLessonSchema.extend({
  lessonType: z.literal("handout"),
});

const quizSchema = baseLessonSchema.extend({
  lessonType: z.literal("quiz"),
  quizSettings: quizSettingsSchema,
});

const assignmentSchema = baseLessonSchema.extend({
  lessonType: z.literal("assignment"),
  quizSettings: assignmentSettingsSchema,
});

// ============================================
// TYPES
// ============================================
export type HandoutLesson = z.infer<typeof handoutSchema>;
export type QuizLesson = z.infer<typeof quizSchema>;
export type AssignmentLesson = z.infer<typeof assignmentSchema>;

// ============================================
// DISCRIMINATED UNION SCHEMA - USE THIS ONE
// ============================================
export const lessonTeacherSchema = z.discriminatedUnion("lessonType", [
  handoutSchema,
  quizSchema,
  assignmentSchema,
]);

// Type for form values
export type LessonTeacherData = z.infer<typeof lessonTeacherSchema>;

// For react-hook-form resolver
export const addLessonTeacherSchema = lessonTeacherSchema;

// ============================================
// TYPE GUARDS
// ============================================
export function isQuizLesson(data: LessonTeacherData): data is QuizLesson {
  return data.lessonType === "quiz";
}

export function isAssignmentLesson(
  data: LessonTeacherData,
): data is AssignmentLesson {
  return data.lessonType === "assignment";
}

export function isHandoutLesson(
  data: LessonTeacherData,
): data is HandoutLesson {
  return data.lessonType === "handout";
}

export function hasQuizSettings(
  data: LessonTeacherData,
): data is QuizLesson | AssignmentLesson {
  return data.lessonType === "quiz" || data.lessonType === "assignment";
}

// ============================================
// DEFAULT VALUES
// ============================================
export const defaultQuizSettings: QuizSettings = {
  timeLimit: 30,
  maxAttempts: 3,
  shuffleQuestions: false,
  showScoreAfterSubmission: false,
  showCorrectAnswers: false,
  startDate: undefined,
  endDate: undefined,
};

export const defaultAssignmentSettings: AssignmentSettings = {
  maxAttempts: 2,
  scores: 100,
  startDate: undefined,
  endDate: undefined,
};

export function getDefaultLessonValues(
  lessonType: LessonType,
): LessonTeacherData {
  const baseDefaults = {
    lessonId: "",
    lessonTypeId: 0,
    title: "",
    markDownDescription: "",
  };

  switch (lessonType) {
    case "handout":
      return {
        ...baseDefaults,
        lessonType: "handout" as const,
      };
    case "quiz":
      return {
        ...baseDefaults,
        lessonType: "quiz" as const,
        quizSettings: defaultQuizSettings,
      };
    case "assignment":
      return {
        ...baseDefaults,
        lessonType: "assignment" as const,
        quizSettings: defaultAssignmentSettings,
      };
    default:
      const _exhaustive: never = lessonType;
      throw new Error(`Unknown lesson type: ${_exhaustive}`);
  }
}

// ============================================
// TRPC ROUTER TYPES
// ============================================
export type UserGetCurrentSectionInfo =
  inferRouterOutputs<AppRouter>["user"]["getCurrentSectionInfo"];
export type UserGetLessonsInClass =
  inferRouterOutputs<AppRouter>["user"]["getAllLessonsInClass"];
export type UserGetAllLessonsWithContentsInClass =
  inferRouterOutputs<AppRouter>["user"]["getAllLessonsWithContentsInClass"];
export type UserAddLessonType =
  inferRouterOutputs<AppRouter>["user"]["createLessonType"];
export type AdminLessonDocument =
  inferRouterOutputs<AppRouter>["admin"]["getLessonDocument"];
