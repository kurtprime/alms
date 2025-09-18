import { z } from "zod";
import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { isUint8ClampedArray } from "util/types";

export const createSectionFormSchema = z.object({
  name: z.string().min(2, { message: "Strand name is needed" }).max(100),
  slug: z.string().min(2, { message: "What is the section name" }).max(50),
});

export type AdminCreateSection =
  inferRouterOutputs<AppRouter>["admin"]["create"];

export type AdminSectionGetMany =
  inferRouterOutputs<AppRouter>["admin"]["getManySections"];
