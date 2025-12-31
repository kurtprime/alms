import { adminProcedure } from "@/trpc/init";
import {
  createLessonSchema,
  createLessonTypeSchema,
  updateLessonSchema,
  updateMarkUp,
  updateQuizSettingsFormSchema,
} from "../adminSchema";
import { db } from "@/index";
import {
  lesson,
  lessonDocument,
  lessonType,
  mdxEditorImageUpload,
  quiz,
} from "@/db/schema";
import z from "zod";
import { and, desc, eq, inArray, not, sql } from "drizzle-orm";
import { uploadthing } from "@/services/uploadthing/client";
import { TRPCError } from "@trpc/server";
import { deleteExistingFile } from "@/services/uploadthing/server";
import { inngest } from "@/services/inngest/client";

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
    .mutation(async ({ input, ctx }) => {
      const { name, lessonId, type } = input;

      await db.transaction(async (tx) => {
        const [lessonTypeResult] = await tx
          .insert(lessonType)
          .values({
            name,
            lessonId,
            type,
          })
          .returning({ id: lessonType.id });

        if (type === "assignment")
          await tx.insert(quiz).values({
            lessonTypeId: lessonTypeResult.id,
            createdBy: ctx.auth.user.id,
          });
      });
    }),
  getLessonType: adminProcedure
    .input(z.object({ lessonId: z.int() }))
    .query(async ({ input }) => {
      const { lessonId } = input;

      const data = await db
        .select()
        .from(lessonType)
        .where(
          and(
            eq(lessonType.lessonId, lessonId),
            not(eq(lessonType.status, "archived"))
          )
        )
        .orderBy(lessonType.createdAt);

      console.log(data);
      return data;
    }),
  deleteLessonDocument: adminProcedure
    .input(z.object({ fileKey: z.string() }))
    .mutation(async ({ input }) => {
      const { fileKey } = input;
      await uploadthing.deleteFiles(fileKey);

      await db
        .delete(lessonDocument)
        .where(eq(lessonDocument.fileKey, fileKey));
    }),
  getLessonDocument: adminProcedure
    .input(
      z.object({
        lessonId: z.int(),
      })
    )
    .query(async ({ input }) => {
      const { lessonId } = input;

      const lessonDocuments = await db
        .select()
        .from(lessonDocument)
        .where(eq(lessonDocument.lessonTypeId, lessonId));

      return lessonDocuments;
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
  getMarkUp: adminProcedure
    .input(
      z.object({
        id: z.int(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;

      const [{ markup }] = await db
        .select({ markup: lessonType.markup })
        .from(lessonType)
        .where(
          and(eq(lessonType.id, id), not(eq(lessonType.status, "archived")))
        )
        .limit(1);

      return markup ?? "";
    }),
  updateMarkUp: adminProcedure
    .input(updateMarkUp)
    .mutation(async ({ input }) => {
      const { lessonTypeId, markup } = input;

      await db
        .update(lessonType)
        .set({
          markup: markup,
        })
        .where(eq(lessonType.id, lessonTypeId));

      await inngest.send({
        name: "uploadthing/markup.image.upload",
        data: input,
      });
    }),
  updateLessonTypeName: adminProcedure
    .input(
      z.object({
        id: z.int(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, name } = input;

      await db
        .update(lessonType)
        .set({
          name,
        })
        .where(eq(lessonType.id, id));
    }),
  updateLessonTypeStatus: adminProcedure
    .input(
      z.object({
        status: z.enum(["published", "draft", "archived"]),
        id: z.int(),
      })
    )
    .mutation(async ({ input }) => {
      const { status, id } = input;

      await db
        .update(lessonType)
        .set({
          status,
        })
        .where(eq(lessonType.id, id));
    }),
  getQuizSettings: adminProcedure
    .input(z.object({ lessonTypeId: z.number() }))
    .query(async ({ input }) => {
      const { lessonTypeId } = input;

      const [quizSettings] = await db
        .select()
        .from(quiz)
        .where(eq(quiz.lessonTypeId, lessonTypeId))
        .limit(1);

      return quizSettings;
    }),
  updateQuizSettings: adminProcedure
    .input(
      z.object({
        ...updateQuizSettingsFormSchema.shape,
        lessonTypeId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        lessonTypeId,
        attemptsAllowed,
        isShuffleQuestions,
        isShowCorrectAnswers,
        isShowScoreAfterSubmission,
        startDate,
        endDate,
        timeLimit,
      } = input;

      await db
        .update(quiz)
        .set({
          timeLimit,
          maxAttempts: attemptsAllowed,
          shuffleQuestions: isShuffleQuestions,
          showCorrectAnswers: isShowCorrectAnswers,
          showScoreAfterSubmission: isShowScoreAfterSubmission,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        })
        .where(eq(quiz.lessonTypeId, lessonTypeId));
    }),
};
