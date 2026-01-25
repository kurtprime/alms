import { z } from "zod";
import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import {
  lessonTerm,
  lessonTypeEnum,
  organizationMemberStrand,
  statusEnumValues,
} from "@/db/schema";
import { desc } from "drizzle-orm";

export const createSectionFormSchema = z.object({
  name: z.string().min(2, { message: "Strand name is needed" }).max(100),
  slug: z.string().min(2, { message: "What is the section name" }).max(50),
});

export const updateMarkUp = z.object({
  lessonTypeId: z.int(),
  markup: z.string(),
});

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const markupImageUpload = z.object({
  image: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported.",
    ),
});

export const createStudentFormSchema = z
  .object({
    firstName: z.string().min(1, { message: "Name is required" }).max(100),
    lastName: z.string().min(1, { message: "Last name is required" }).max(100),
    middleInitial: z
      .string()
      .max(2, { message: "Middle initial must be at most 2 characters" })
      .optional(),
    organizationId: z.string().nullish(),
    userId: z.string().min(1, { message: "User ID is required" }),
    strand: z.enum(organizationMemberStrand.enumValues),
  })
  .refine((data) => !(data.organizationId && data.strand === "Not Specified"), {
    message: "Cannot select 'Not Specified' strand with an organization",
    path: ["strand"],
  })
  .refine(
    (data) => !(data.strand !== "Not Specified" && !data.organizationId),
    {
      message:
        "Organization is required for all strands except 'Not Specified'",
      path: ["organizationId"],
    },
  );

export const updateStudentFormSchema = z
  .object({
    ...createStudentFormSchema.shape,
    id: z.string().min(1, { message: "Student ID is required" }),
  })
  .refine((data) => !(data.organizationId && data.strand === "Not Specified"), {
    message: "Cannot select 'Not Specified' strand with an organization",
    path: ["strand"],
  })
  .refine(
    (data) => !(data.strand !== "Not Specified" && !data.organizationId),
    {
      message:
        "Organization is required for all strands except 'Not Specified'",
      path: ["organizationId"],
    },
  );
export const createTeacherFormSchema = z.object({
  firstName: z.string().min(1, { message: "Name is required" }).max(100),
  lastName: z.string().min(1, { message: "Last name is required" }).max(100),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required" }),
  code: z.string().min(1, { message: "Subject Code is Required" }).max(6),
  description: z.string().optional(),
  teacherId: z.string().min(1, { message: "Teacher is required" }),
  classId: z.string().min(1, { message: "Class is required" }),
  status: z.enum(statusEnumValues).default("draft"),
});

export const createLessonSchema = z.object({
  name: z.string().min(1, { message: "Lesson name is required" }).max(50),
  terms: z.enum(lessonTerm.enumValues),
  classId: z.string().min(1, { message: "Class ID is required" }),
});

export const createLessonTypeSchema = z.object({
  name: z.string(),
  lessonId: z.int().min(1, { message: "something went wrong" }),
  type: z.enum(lessonTypeEnum.enumValues),
});

export const updateLessonSchema = z.object({
  ...createLessonSchema.shape,
  id: z.int(),
});

export const updateQuizSettingsFormSchema = z
  .object({
    description: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    attemptsAllowed: z.number().min(1).default(1),
    isShuffleQuestions: z.boolean().default(false),
    isShowCorrectAnswers: z.boolean().default(false),
    isShowScoreAfterSubmission: z.boolean().default(false),
    startDate: z
      .union([
        z.string().datetime(), // ISO 8601 format
        z.date(),
      ])
      .nullish(),

    endDate: z.union([z.string().datetime(), z.date()]).nullish(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;

      // Ensure both are Date objects for comparison
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      return diffInHours >= 1;
    },
    {
      message: "End date must be at least 1 hour after start date",
      path: ["endDate"],
    },
  );

export const newSubjectNameSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required" }).max(100),
  description: z.string().optional(),
});

export const getManySectionsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
});

export const getManyStudentsSchema = z.object({
  userId: z.string().optional(), // Filter by specific user
  organizationId: z.string().optional(), // Filter by organization
  strand: z.enum(organizationMemberStrand.enumValues).optional(), // Filter by strand
  search: z.string().optional(), // Search by name or customId
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(), // For pagination
});

export const getSubjectSchema = z.object({});

export const getManyTeachersSchema = z.object({});

export const getAllSubjectsForClassSchema = z.object({
  subjectId: z.int().min(1, { message: "Class ID is required" }),
});

export const getAllSubjectInfoSchema = z.object({
  id: z.string().min(1, { message: "Class ID is required" }),
});

const multipleChoiceSchema = z.object({
  multipleChoiceId: z.string(),
  questionId: z.number(),
  optionText: z.string(),
  points: z.number(),
  imageBase64Jpg: z.string().nullish(),
  isCorrect: z.boolean().nullable(), // boolean | null
  orderIndex: z.number().nullable(), // number | null
  feedback: z.string().nullish(), // string | null
});

export const updateMultipleChoiceQuestionDetailsSchema = z
  .object({
    id: z.number().min(1, { message: "Question ID is required" }),
    question: z.string(),
    points: z.number().min(1, { message: "Total points must not be below 1" }),
    required: z.boolean().nullable(),
    multipleChoices: z.array(multipleChoiceSchema),
    imageBase64: z.string().nullish(),
    deletedChoiceIds: z.array(z.string()),
  })
  .refine(
    (data) => {
      // If question is required, ensure at least one correct answer exists
      if (data.required) {
        const hasCorrectAnswer = data.multipleChoices.some(
          (choice) => choice.isCorrect === true,
        );
        return hasCorrectAnswer;
      }
      return true; // Not required, so no validation needed
    },
    {
      message: "Required questions must have at least one correct answer",
      path: ["multipleChoices"], // Error appears on the choices field
    },
  )
  .transform((data) => ({
    ...data,
    points: data.multipleChoices.reduce(
      (acc, choice) => acc + choice.points,
      0,
    ), // Auto-calculate
  }));

const orderingChoiceSchema = z.object({
  orderingOptionId: z.string(),
  itemText: z.string(),
  points: z.number(),
  questionId: z.number(),
  correctPosition: z.number(),
  imageBase64Jpg: z.string().nullish(),
});

export const updateOrderingChoiceDetailSchema = z.object({
  id: z.number(),
  question: z.string(),
  points: z.number(),
  required: z.boolean(),
  imageBase64Jpg: z.string().nullish(),
  deletedChoiceIds: z.array(z.string()),
  orderingOptions: z.array(orderingChoiceSchema),
});

const matchingPairSchema = z.object({
  matchingPairId: z.string(),
  questionId: z.number(),
  leftItem: z.string().nullable(),
  rightItem: z.string(),
  orderIndex: z.number().nullable(),
  points: z.number(),
  leftImageBase64Jpg: z.string().nullish(),
  rightImageBase64Jpg: z.string().nullish(),
});

export const updateMatchingPairDetailSchema = z.object({
  id: z.number(),
  question: z.string(),
  points: z.number(),
  required: z.boolean(),
  imageBase64Jpg: z.string().nullish(),
  deletedChoiceIds: z.array(z.string()),
  matchingOptions: z.array(matchingPairSchema),
});

export const updateTrueOrFalseQuestionDetailsSchema = z.object({
  id: z.number().min(1, { message: "Question ID is required" }),
  question: z.string(),
  points: z.number().min(1, { message: "Points cannot go below 1" }),
  required: z.boolean().nullable(),
  correctBoolean: z.boolean(),
  imageBase64Jpg: z.string().nullish(),
});

export const updateEssayQuestionDetailSchema = z.object({
  id: z.number().min(1, { message: "Question ID is required" }),
  question: z.string(),
  points: z.number().min(1, { message: "Points cannot go below 1" }),
  required: z.boolean().nullable(),
  imageBase64Jpg: z.string().nullish(),
});

export const mdxEditorSchema = z.object({ description: z.string() });

export type AdminCreateSection =
  inferRouterOutputs<AppRouter>["admin"]["create"];

export type AdminSectionGetMany =
  inferRouterOutputs<AppRouter>["admin"]["getManySections"];

export type AdminGetStudents =
  inferRouterOutputs<AppRouter>["admin"]["getManyStudents"];

export type AdminGetTeachers =
  inferRouterOutputs<AppRouter>["admin"]["getManyTeachers"];

export type AdminGetAllClassPerSubject =
  inferRouterOutputs<AppRouter>["admin"]["getAllSubjectInfo"];

export type AdminGetAllClassPerSubjectId =
  inferRouterOutputs<AppRouter>["admin"]["getAllSubjectIdPerClass"];

export type AdminGetLessonsPerClass =
  inferRouterOutputs<AppRouter>["admin"]["getLessonsPerClass"];

export type AdminGetLessonsTypes =
  inferRouterOutputs<AppRouter>["admin"]["getLessonType"];

export type AdminGetQuizSettings =
  inferRouterOutputs<AppRouter>["admin"]["getQuizSettings"];

export type AdminGetQuizQuestions =
  inferRouterOutputs<AppRouter>["admin"]["getQuizQuestions"];

export type AdminGetMultipleChoiceQuizQuestions =
  inferRouterOutputs<AppRouter>["admin"]["getMultipleChoiceQuestionDetails"];

export type AdminUpdateMultipleChoiceQuizQuestions =
  inferRouterOutputs<AppRouter>["admin"]["updateMultipleChoiceQuestionDetails"];

export type AdminGetTrueOrFalseQuizQuestions =
  inferRouterOutputs<AppRouter>["admin"]["getTrueOrFalseQuestionDetails"];

export type AdminGetEssayQuizQuestion =
  inferRouterOutputs<AppRouter>["admin"]["getEssayQuestionDetails"];

export type AdminGetOrderingQuizQuestion =
  inferRouterOutputs<AppRouter>["admin"]["getOrderingQuestionDetails"];

export type AdminOrderingChoiceQuizQuestions =
  inferRouterOutputs<AppRouter>["admin"]["updateOrderingQuestionDetails"];

export type AdminGetMatchingPairQuestion =
  inferRouterOutputs<AppRouter>["admin"]["getMatchingQuestionDetails"];

export type AdminMatchingPairQuestion =
  inferRouterOutputs<AppRouter>["admin"]["updateMatchingQuestionDetails"];
