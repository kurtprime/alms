import { z } from "zod";
import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { statusEnumValues } from "@/db/schema";

export const createSectionFormSchema = z.object({
  name: z.string().min(2, { message: "Strand name is needed" }).max(100),
  slug: z.string().min(2, { message: "What is the section name" }).max(50),
});

export const createStudentFormSchema = z.object({
  firstName: z.string().min(1, { message: "Name is required" }).max(100),
  lastName: z.string().min(1, { message: "Last name is required" }).max(100),
  organizationId: z.string().nullish(),
});

export const createTeacherFormSchema = z.object({
  firstName: z.string().min(1, { message: "Name is required" }).max(100),
  lastName: z.string().min(1, { message: "Last name is required" }).max(100),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required" }),
  code: z.string().min(1, { message: "Subject Code is Required" }).max(20),
  description: z.string().optional(),
  teacherId: z.string().min(1, { message: "Teacher is required" }),
  classId: z.string().min(1, { message: "Class is required" }),
  status: z.enum(statusEnumValues).default("draft"),
});

export const newSubjectNameSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required" }).max(100),
  description: z.string().optional(),
});

export const getManySectionsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
});

export const getManyStudentsSchema = z.object({});

export const getSubjectSchema = z.object({});

export const getManyTeachersSchema = z.object({});

export const getAllSubjectsForClassSchema = z.object({
  subjectId: z.string().min(1, { message: "Class ID is required" }),
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
  inferRouterOutputs<AppRouter>["admin"]["getAllSubjectsPerClass"];
