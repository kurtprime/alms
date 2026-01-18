import { adminProcedure } from "@/trpc/init";
import {
  createLessonSchema,
  createLessonTypeSchema,
  updateLessonSchema,
  updateMarkUp,
  updateMultipleChoiceQuestionDetailsSchema,
  updateQuizSettingsFormSchema,
} from "../adminSchema";
import { db } from "@/index";
import {
  lesson,
  lessonDocument,
  lessonType,
  quiz,
  quizAnswerOption,
  quizQuestion,
  quizTypeEnum,
} from "@/db/schema";
import z from "zod";
import { and, eq, inArray, not, sql } from "drizzle-orm";
import { uploadthing } from "@/services/uploadthing/client";
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
  addQuizQuestion: adminProcedure
    .input(
      z.object({
        quizId: z.number(),
        questionType: z.enum(quizTypeEnum.enumValues),
        orderIndex: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { quizId, questionType, orderIndex } = input;
      await db.insert(quizQuestion).values({
        quizId,
        type: questionType,
        question: "",
        orderIndex,
      });
    }),
  getQuizQuestions: adminProcedure
    .input(
      z.object({
        quizId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { quizId } = input;

      const quizQuestions = await db
        .select({
          id: quizQuestion.id,
          type: quizQuestion.type,
          orderIndex: quizQuestion.orderIndex,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.quizId, quizId))
        .orderBy(quizQuestion.orderIndex);

      return quizQuestions;
    }),
  getMultipleChoiceQuestionDetails: adminProcedure
    .input(z.object({ quizQuestionId: z.number() }))
    .query(async ({ input }) => {
      const { quizQuestionId } = input;

      const awaitQuestionDetails = db
        .select({
          id: quizQuestion.id,
          question: quizQuestion.question,
          points: quizQuestion.points,
          orderIndex: quizQuestion.orderIndex,
          required: quizQuestion.required,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, quizQuestionId));

      const awaitMultipleChoiceOptions = db
        .select({
          multipleChoiceId: quizAnswerOption.id,
          optionText: quizAnswerOption.optionText,
          questionId: quizAnswerOption.questionId,
          isCorrect: quizAnswerOption.isCorrect,
          orderIndex: quizAnswerOption.orderIndex,
        })
        .from(quizAnswerOption)
        .where(eq(quizAnswerOption.questionId, quizQuestionId))
        .orderBy(quizAnswerOption.orderIndex);

      const [[questionDetails], multipleChoiceOptions] = await Promise.all([
        awaitQuestionDetails,
        awaitMultipleChoiceOptions,
      ]);

      return {
        ...questionDetails,
        multipleChoices: multipleChoiceOptions,
      };
    }),
  updateMultipleChoiceQuestionDetails: adminProcedure
    .input(updateMultipleChoiceQuestionDetailsSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        question,
        points,
        required,
        multipleChoices,
        deletedChoiceIds,
      } = input;

      console.log(input);

      await db.transaction(async (tx) => {
        const [quizQuestionId] = await tx
          .update(quizQuestion)
          .set({
            question,
            points,
            required,
          })
          .where(eq(quizQuestion.id, id))
          .returning({ id: quizQuestion.id });

        if (deletedChoiceIds.length > 0) {
          // Filter out temp IDs - they don't exist in DB yet
          const realIdsToDelete = deletedChoiceIds.filter(
            (id) => !id.startsWith("temp_")
          );
          if (realIdsToDelete.length > 0) {
            await tx
              .delete(quizAnswerOption)
              .where(inArray(quizAnswerOption.id, realIdsToDelete));
          }
        }

        if (multipleChoices && multipleChoices.length > 0) {
          for (const choice of multipleChoices) {
            const {
              multipleChoiceId: id,
              optionText,
              isCorrect,
              orderIndex,
              feedback,
            } = choice;
            // NEW: Check if it's a temp ID (new choice)
            if (id.startsWith("temp_")) {
              // INSERT new choice
              await tx.insert(quizAnswerOption).values({
                id: id.substring(5),
                questionId: quizQuestionId.id,
                optionText,
                isCorrect,
                orderIndex,
                feedback,
              });
            } else {
              // UPDATE existing choice
              await tx
                .update(quizAnswerOption)
                .set({
                  optionText,
                  isCorrect,
                  orderIndex,
                  feedback,
                })
                .where(eq(quizAnswerOption.id, id));
            }
          }
        }
      });
    }),
};
