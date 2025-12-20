import { z } from "zod";
import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import {
  lessonTerm,
  lessonTypeEnum,
  organizationMemberStrand,
  statusEnumValues,
} from "@/db/schema";

export const createSectionFormSchema = z.object({
  name: z.string().min(2, { message: "Strand name is needed" }).max(100),
  slug: z.string().min(2, { message: "What is the section name" }).max(50),
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
    }
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
    }
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
