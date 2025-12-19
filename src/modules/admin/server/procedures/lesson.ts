import { adminProcedure } from "@/trpc/init";
import { createLessonSchema, updateLessonSchema } from "../adminSchema";
import { db } from "@/index";
import { lesson } from "@/db/schema";
import z from "zod";
import { and, eq, sql } from "drizzle-orm";

export const lessonActions = {
  createLessons: adminProcedure
    .input(createLessonSchema)
    .mutation(async ({ input }) => {
      const { name, terms, classId } = input;

      await db
        .insert(lesson)
        .values({ name: name, terms: terms, classSubjectId: classId });
    }),
  updateLessons: adminProcedure
    .input(updateLessonSchema)
    .mutation(async ({ input }) => {
      const { terms, name, id } = input;

      await db
        .update(lesson)
        .set({
          name: name,
          terms: terms,
        })
        .where(eq(lesson.id, id));
    }),
  archiveLesson: adminProcedure
    .input(
      z.object({
        id: z.int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      await db
        .update(lesson)
        .set({
          status: "archived",
        })
        .where(eq(lesson.id, id));
    }),
  getLessonsPerClass: adminProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ input }) => {
      const { classId } = input;
      const lessons = await db
        .select()
        .from(lesson)
        .where(
          and(
            eq(lesson.classSubjectId, classId),
            eq(lesson.status, "published")
          )
        ).orderBy(sql`
        CASE ${lesson.terms}
          WHEN 'prelims' THEN 1
          WHEN 'midterms' THEN 2
          WHEN 'pre-finals' THEN 3
          WHEN 'finals' THEN 4
        END
      `);

      return lessons;
    }),
};
