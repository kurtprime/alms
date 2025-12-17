import { adminProcedure } from "@/trpc/init";
import { admin } from "better-auth/plugins/admin";
import { createLessonSchema } from "../adminSchema";
import { db } from "@/index";
import { lesson } from "@/db/schema";

export const lessonActions = {
  createLessons: adminProcedure
    .input(createLessonSchema)
    .mutation(async ({ input }) => {
      const { name, terms, classId } = input;

      await db
        .insert(lesson)
        .values({ name: name, terms: terms, classSubjectId: classId });
    }),
};
