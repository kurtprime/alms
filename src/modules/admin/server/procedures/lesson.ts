import { adminProcedure } from "@/trpc/init";
import {
  createLessonSchema,
  createLessonTypeSchema,
  updateLessonSchema,
} from "../adminSchema";
import { db } from "@/index";
import { lesson, lessonType } from "@/db/schema";
import z from "zod";
import { and, eq, not, sql } from "drizzle-orm";

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
  createLessonType: adminProcedure
    .input(createLessonTypeSchema)
    .mutation(async ({ input }) => {
      const { name, lessonId, type } = input;

      await db.insert(lessonType).values({
        name,
        lessonId,
        type,
      });
    }),
  getLessonType: adminProcedure
    .input(z.object({ lessonId: z.int() }))
    .query(async ({ input }) => {
      const { lessonId } = input;

      return await db
        .select()
        .from(lessonType)
        .where(
          and(
            eq(lessonType.lessonId, lessonId),
            not(eq(lessonType.status, "archived"))
          )
        );
    }),
  getLessonsPerClass: adminProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ input }) => {
      const { classId } = input;
      const lessons = await db
        .select({
          id: lesson.id,
          name: lesson.name,
          terms: lesson.terms,
          status: lesson.status,
          classSubjectId: lesson.classSubjectId,
          topicCount:
            sql<number>`count(case when ${lessonType.type} = 'topic' then 1 end)`.as(
              "topic_count"
            ),
          activityCount:
            sql<number>`count(case when ${lessonType.type} = 'activity' then 1 end)`.as(
              "activity_count"
            ),
        })
        .from(lesson)
        .leftJoin(lessonType, eq(lessonType.lessonId, lesson.id))
        .where(
          and(
            eq(lesson.classSubjectId, classId),
            not(eq(lesson.status, "archived"))
          )
        )
        .groupBy(
          lesson.id, // Group by all non-aggregated columns
          lesson.name,
          lesson.terms,
          lesson.status,
          lesson.classSubjectId
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
