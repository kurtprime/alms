import {
  lesson,
  lessonType,
  lessonTypeEnum,
  publishStatusEnum,
  quiz,
  quizAttempt,
} from "@/db/schema";
import { db } from "@/index";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import z from "zod";
import {
  addLessonTeacherSchema,
  AssignmentSettings,
  defaultAssignmentSettings,
  defaultQuizSettings,
} from "../userSchema";
import { inngest } from "@/services/inngest/client";
import { deepCloneQuiz } from "../helpers";
import { QuizSettings } from "../userSchema";

export const lessonActions = {
  createLessonType: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        lessonTypeEnum: z.enum(lessonTypeEnum.enumValues),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const { classId, lessonTypeEnum } = input;
      const { auth } = ctx;

      const result = await db.transaction(async (tx) => {
        // 1. Get or create lesson
        const existingDraft = await tx
          .select()
          .from(lesson)
          .where(
            and(eq(lesson.classSubjectId, classId), eq(lesson.status, "draft")),
          )
          .limit(1);

        const lessonData =
          existingDraft.length > 0
            ? existingDraft[0]
            : (
                await tx
                  .insert(lesson)
                  .values({
                    classSubjectId: classId,
                    status: "draft",
                    terms: null,
                    name: "",
                  })
                  .returning()
              )[0];

        // 2. Create lesson type
        const [lessonTypeData] = await tx
          .insert(lessonType)
          .values({
            lessonId: lessonData.id,
            type: lessonTypeEnum,
          })
          .returning();

        // 3. Create settings based on type
        switch (lessonTypeEnum) {
          case "handout":
            return {
              lessonData,
              lessonTypeData,
            } as const;

          case "assignment": {
            const [quizData] = await tx
              .insert(quiz)
              .values({
                lessonTypeId: lessonTypeData.id,
                score: 100,
                createdBy: auth.user.id,
              })
              .returning();

            return {
              lessonData,
              lessonTypeData,
              quizSetting: defaultAssignmentSettings,
              quizData,
            } as const;
          }

          case "quiz": {
            const [quizData] = await tx
              .insert(quiz)
              .values({
                lessonTypeId: lessonTypeData.id,
                createdBy: auth.user.id,
              })
              .returning();

            return {
              lessonData,
              lessonTypeData,
              quizSetting: defaultQuizSettings,
              quizData,
            } as const;
          }

          default:
            // Exhaustive check
            const _exhaustive: never = lessonTypeEnum;
            throw new Error(`Unknown lesson type: ${_exhaustive}`);
        }
      });

      return result;
    }),
  updateLessonType: protectedProcedure
    .input(
      addLessonTeacherSchema.and(
        z.object({
          status: z.enum(publishStatusEnum.enumValues).nullish(),
          classId: z.string(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        lessonId,
        title,
        markDownDescription,
        lessonTypeId,
        status,
        lessonType: lessonTypeEnum,
        classId,
      } = input;

      if (ctx.auth.user.role !== "teacher")
        throw new TRPCError({ code: "FORBIDDEN", message: "Not Authorize" });

      console.log(input);

      const updatedDataPromise = db
        .update(lessonType)
        .set({
          name: title,
          markup: markDownDescription,
          lessonId: +lessonId,
          status: status ? status : undefined,
          publishedAt:
            status === "published"
              ? sql`CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END`
              : undefined,
        })
        .where(eq(lessonType.id, lessonTypeId));
      console.log("success update data");

      const promises: Promise<unknown>[] = [updatedDataPromise];

      // 3. Conditionally add Quiz/Assignment update
      if (lessonTypeEnum === "quiz") {
        const { quizSettings } = input;
        if (!quizSettings.quizId)
          throw new TRPCError({ code: "CONFLICT", message: "select a quiz" });

        const { quizId } = quizSettings;
        // 1. Fetch the source quiz to check if it's a template or live
        const [sourceQuiz] = await db
          .select()
          .from(quiz)
          .where(eq(quiz.id, quizId));

        if (!sourceQuiz)
          throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });

        // 2. DETERMINE ACTION

        // CASE 1: TEMPLATE (lessonTypeId is null) -> ALWAYS CLONE
        const isTemplate = sourceQuiz.lessonTypeId === null;

        // CASE 2: CURRENT LIVE QUIZ -> UPDATE ONLY
        const isCurrentQuiz = sourceQuiz.lessonTypeId === lessonTypeId;

        if (isTemplate || !isCurrentQuiz) {
          // --- CLONE PATH ---

          // A. Handle Existing Quiz on this Lesson (Replace Logic)
          const [existingQuiz] = await db
            .select()
            .from(quiz)
            .where(eq(quiz.lessonTypeId, lessonTypeId))
            .limit(1);

          if (existingQuiz && existingQuiz.id !== quizId) {
            const attempts = await db
              .select()
              .from(quizAttempt)
              .where(eq(quizAttempt.quizId, existingQuiz.id))
              .limit(1);

            if (attempts.length > 0) {
              // Archive if has attempts
              await db
                .update(quiz)
                .set({ lessonTypeId: null, status: "archived" })
                .where(eq(quiz.id, existingQuiz.id));
            } else {
              // Delete if untouched
              await db.delete(quiz).where(eq(quiz.id, existingQuiz.id));
            }
          }

          // B. Deep Clone the Template/Source
          console.log("Debugging Quiz: ",quizId, lessonTypeId, input.quizSettings)
          
          await deepCloneQuiz(quizId, lessonTypeId, input.quizSettings);
        }
      } else if (lessonTypeEnum === "assignment") {
        const updateAssignment = db
          .update(quiz)
          .set({
            maxAttempts: input.quizSettings.maxAttempts,
            score: input.quizSettings.scores,
            startDate: input.quizSettings.startDate
              ? new Date(input.quizSettings.startDate)
              : undefined,
            endDate: input.quizSettings.endDate
              ? new Date(input.quizSettings.endDate)
              : undefined,
          })
          .where(eq(quiz.lessonTypeId, lessonTypeId));

        promises.push(updateAssignment);
      }
      // If it's 'handout', we simply don't add anything to promises

      // 4. Execute all valid queries
      await Promise.all([
        ...promises,
        inngest.send({
          name: "uploadthing/markup.image.upload",
          data: { lessonTypeId, markup: markDownDescription },
        }),
        inngest.send({
          name: "lesson/published",
          data: {
            lessonTypeId: lessonTypeId,
            classId: classId,
            teacherId: ctx.auth.user.id,
          },
        }),
      ]);
      console.log("Updated Settings");
    }),
  deleteLessonType: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not Authorize" });
      }

      const { lessonTypeId } = input;

      await db.delete(lessonType).where(eq(lessonType.id, lessonTypeId));
    }),
};
