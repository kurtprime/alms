import { z } from "zod";
import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { isUint8ClampedArray } from "util/types";
import { section } from "./procedures/section";

export const createSectionFormSchema = z.object({
  name: z.string().min(2, { message: "Strand name is needed" }).max(100),
  slug: z.string().min(2, { message: "What is the section name" }).max(50),
});

export const createUserFormSchema = z.object({
  firstName: z.string().min(1, { message: "Name is required" }).max(100),
  lastName: z.string().min(1, { message: "Last name is required" }).max(100),
  organizationId: z.string().nullish(),
});

export const getManySectionsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
});

export const getManyStudentsSchema = z.object({});

export type AdminCreateSection =
  inferRouterOutputs<AppRouter>["admin"]["create"];

export type AdminSectionGetMany =
  inferRouterOutputs<AppRouter>["admin"]["getManySections"];

export type AdminGetStudents =
  inferRouterOutputs<AppRouter>["admin"]["getManyStudents"];
