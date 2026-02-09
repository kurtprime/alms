import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import z from "zod";

export const addLessonTeacherSchema = z.object({
  lessonId: z.string(),
  lessonTypeId: z.int(),
  title: z.string(),
  markDownDescription: z.string(),
});

export type UserGetCurrentSectionInfo =
  inferRouterOutputs<AppRouter>["user"]["getCurrentSectionInfo"];

export type UserGetLessonsInClass =
  inferRouterOutputs<AppRouter>["user"]["getAllLessonsInClass"];

export type UserGetAllLessonsWithContentsInClass =
  inferRouterOutputs<AppRouter>["user"]["getAllLessonsWithContentsInClass"];

export type UserAddLessonType =
  inferRouterOutputs<AppRouter>["user"]["createLessonType"];
