import {
  lesson,
  lessonType,
  lessonTypeEnum,
  publishStatusEnum,
  quiz,
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
        const updateQuiz = db
          .update(quiz)
          .set({
            timeLimit: input.quizSettings.timeLimit,
            maxAttempts: input.quizSettings.maxAttempts,
            shuffleQuestions: input.quizSettings.shuffleQuestions,
            showScoreAfterSubmission:
              input.quizSettings.showScoreAfterSubmission,
            showCorrectAnswers: input.quizSettings.showCorrectAnswers,
            startDate: input.quizSettings.startDate
              ? new Date(input.quizSettings.startDate)
              : undefined,
            endDate: input.quizSettings.endDate
              ? new Date(input.quizSettings.endDate)
              : undefined,
          })
          .where(eq(quiz.lessonTypeId, lessonTypeId));

        promises.push(updateQuiz);
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
      await Promise.all(promises);
      console.log("Updated Settings");
      await inngest.send({
        name: "uploadthing/markup.image.upload",
        data: { lessonTypeId, markup: markDownDescription },
      });
      await inngest.send({
        name: "lesson/published",
        data: {
          lessonTypeId: lessonTypeId,
          classId: classId,
          teacherId: ctx.auth.user.id,
        },
      });
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
