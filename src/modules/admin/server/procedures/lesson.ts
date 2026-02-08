import { adminProcedure } from "@/trpc/init";
import {
  createLessonSchema,
  createLessonTypeSchema,
  updateEssayQuestionDetailSchema,
  updateLessonSchema,
  updateMarkUp,
  updateMatchingPairDetailSchema,
  updateMultipleChoiceQuestionDetailsSchema,
  updateOrderingChoiceDetailSchema,
  updateQuizSettingsFormSchema,
  updateTrueOrFalseQuestionDetailsSchema,
} from "../adminSchema";
import { db } from "@/index";
import {
  lesson,
  lessonDocument,
  lessonType,
  quiz,
  quizAnswerOption,
  quizMatchingPair,
  quizOrderingItem,
  quizQuestion,
  quizTypeEnum,
} from "@/db/schema";
import z from "zod";
import { and, eq, gt, inArray, not, sql } from "drizzle-orm";
import { uploadthing } from "@/services/uploadthing/client";
import { inngest } from "@/services/inngest/client";
import { TRPCError } from "@trpc/server";
import { admin } from "better-auth/plugins/admin";

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
      }),
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

        if (type === "quiz")
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
            not(eq(lessonType.status, "archived")),
          ),
        )
        .orderBy(lessonType.createdAt);

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
      }),
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
            not(eq(lesson.status, "archived")),
          ),
        )
        .groupBy(
          lesson.id, // Group by all non-aggregated columns
          lesson.name,
          lesson.terms,
          lesson.status,
          lesson.classSubjectId,
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
      }),
    )
    .query(async ({ input }) => {
      const { id } = input;

      const [{ markup }] = await db
        .select({ markup: lessonType.markup })
        .from(lessonType)
        .where(
          and(eq(lessonType.id, id), not(eq(lessonType.status, "archived"))),
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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
    )
    .query(async ({ input }) => {
      const { quizId } = input;

      const quizQuestions = await db
        .select({
          id: quizQuestion.id,
          type: quizQuestion.type,
          orderIndex: quizQuestion.orderIndex,
          quizId: quizQuestion.quizId,
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
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, quizQuestionId));

      const awaitMultipleChoiceOptions = db
        .select({
          multipleChoiceId: quizAnswerOption.id,
          optionText: quizAnswerOption.optionText,
          questionId: quizAnswerOption.questionId,
          isCorrect: quizAnswerOption.isCorrect,
          points: quizAnswerOption.points,
          imageBase64Jpg: quizAnswerOption.imageBase64Jpg,
          orderIndex: quizAnswerOption.orderIndex,
        })
        .from(quizAnswerOption)
        .where(eq(quizAnswerOption.questionId, quizQuestionId))
        .orderBy(quizAnswerOption.orderIndex);

      const [[questionDetails], multipleChoiceOptions] = await Promise.all([
        awaitQuestionDetails,
        awaitMultipleChoiceOptions,
      ]);

      if (!questionDetails) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

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
        imageBase64,
      } = input;

      const result = await db.transaction(async (tx) => {
        const [quizQuestionId] = await tx
          .update(quizQuestion)
          .set({
            question,
            points,
            required,
            imageBase64Jpg: imageBase64,
          })
          .where(eq(quizQuestion.id, id))
          .returning({ id: quizQuestion.id });
        if (!quizQuestionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Question not found",
          });
        }

        if (deletedChoiceIds.length > 0) {
          // Filter out temp IDs - they don't exist in DB yet
          const realIdsToDelete = deletedChoiceIds.filter(
            (id) => !id.startsWith("temp_"),
          );
          if (realIdsToDelete.length > 0) {
            await tx
              .delete(quizAnswerOption)
              .where(inArray(quizAnswerOption.id, realIdsToDelete));
          }
        }
        const insertedChoices: { tempId: string; realId: string }[] = [];
        if (multipleChoices && multipleChoices.length > 0) {
          for (const choice of multipleChoices) {
            const {
              multipleChoiceId: id,
              optionText,
              isCorrect,
              orderIndex,
              points,
              feedback,
              imageBase64Jpg,
            } = choice;
            // NEW: Check if it's a temp ID (new choice)
            if (id.startsWith("temp_")) {
              // INSERT new choice

              const [newChoice] = await tx
                .insert(quizAnswerOption)
                .values({
                  id: id.substring(5),
                  questionId: quizQuestionId.id,
                  optionText,
                  isCorrect,
                  orderIndex,
                  feedback,
                  points,
                  imageBase64Jpg,
                })
                .returning({ id: quizAnswerOption.id });

              insertedChoices.push({
                tempId: id,
                realId: newChoice.id,
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
                  points,
                  imageBase64Jpg,
                })
                .where(eq(quizAnswerOption.id, id));
            }
          }
        }
        return { insertedChoices };
      });

      return { success: true, insertedChoices: result.insertedChoices };
    }),
  getMatchingQuestionDetails: adminProcedure
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
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, quizQuestionId));

      const awaitMatchingOptions = db
        .select({
          matchingPairId: quizMatchingPair.id,
          questionId: quizMatchingPair.questionId,
          leftItem: quizMatchingPair.leftItem,
          rightIem: quizMatchingPair.rightItem,
          orderIndex: quizMatchingPair.orderIndex,
          points: quizMatchingPair.points,
          leftImageBase64Jpg: quizMatchingPair.leftImageBase64Jpg,
          rightImageBase64Jpg: quizMatchingPair.rightImageBase64Jpg,
        })
        .from(quizMatchingPair)
        .where(eq(quizMatchingPair.questionId, quizQuestionId))
        .orderBy(quizMatchingPair.orderIndex);

      const [[questionDetails], matchingOptions] = await Promise.all([
        awaitQuestionDetails,
        awaitMatchingOptions,
      ]);

      if (!questionDetails) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

      return {
        ...questionDetails,
        matchingOptions,
      };
    }),
  updateMatchingQuestionDetails: adminProcedure
    .input(updateMatchingPairDetailSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        question,
        points,
        required,
        imageBase64Jpg,
        matchingOptions,
        deletedChoiceIds,
      } = input;

      const result = await db.transaction(async (tx) => {
        const [quizQuestionId] = await tx
          .update(quizQuestion)
          .set({
            question,
            points,
            required,
            imageBase64Jpg,
          })
          .where(eq(quizQuestion.id, id))
          .returning({ id: quizQuestion.id });
        if (!quizQuestionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Question not found",
          });
        }

        if (matchingOptions.length > 0) {
          // Filter out temp IDs - they don't exist in DB yet
          const realIdsToDelete = deletedChoiceIds.filter(
            (id) => !id.startsWith("temp_"),
          );
          if (realIdsToDelete.length > 0) {
            await tx
              .delete(quizMatchingPair)
              .where(inArray(quizMatchingPair.id, realIdsToDelete));
          }
        }
        const insertedChoices: { tempId: string; realId: string }[] = [];
        if (matchingOptions && matchingOptions.length > 0) {
          for (const options of matchingOptions) {
            const {
              matchingPairId: id,
              leftItem,
              rightItem,
              points,
              orderIndex,
              leftImageBase64Jpg,
              rightImageBase64Jpg,
            } = options;
            // NEW: Check if it's a temp ID (new choice)
            if (id.startsWith("temp_")) {
              // INSERT new choice

              const [newChoice] = await tx
                .insert(quizMatchingPair)
                .values({
                  id: id.substring(5),
                  questionId: quizQuestionId.id,
                  leftItem,
                  rightItem,
                  points,
                  orderIndex,
                  leftImageBase64Jpg,
                  rightImageBase64Jpg,
                })
                .returning({ id: quizMatchingPair.id });

              insertedChoices.push({
                tempId: id,
                realId: newChoice.id,
              });
            } else {
              // UPDATE existing choice
              await tx
                .update(quizMatchingPair)
                .set({
                  questionId: quizQuestionId.id,
                  leftItem,
                  rightItem,
                  points,
                  orderIndex,
                  leftImageBase64Jpg,
                  rightImageBase64Jpg,
                })
                .where(eq(quizMatchingPair.id, id));
            }
          }
        }
        return { insertedChoices };
      });

      return { success: true, insertedChoices: result.insertedChoices };
    }),
  getOrderingQuestionDetails: adminProcedure
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
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, quizQuestionId));

      const awaitOrderingOptions = db
        .select({
          orderingOptionId: quizOrderingItem.id,
          itemText: quizOrderingItem.itemText,
          correctPosition: quizOrderingItem.correctPosition,
          imageBase64Jpg: quizOrderingItem.imageBase64Jpg,
          points: quizOrderingItem.points,
          questionId: quizOrderingItem.questionId,
        })
        .from(quizOrderingItem)
        .where(eq(quizOrderingItem.questionId, quizQuestionId))
        .orderBy(quizOrderingItem.correctPosition);

      const [[questionDetails], orderingOptions] = await Promise.all([
        awaitQuestionDetails,
        awaitOrderingOptions,
      ]);

      if (!questionDetails) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

      return {
        ...questionDetails,
        orderingOptions,
      };
    }),

  updateOrderingQuestionDetails: adminProcedure
    .input(updateOrderingChoiceDetailSchema)
    .mutation(async ({ input }) => {
      const {
        id,
        question,
        points,
        required,
        imageBase64Jpg,
        orderingOptions,
        deletedChoiceIds,
      } = input;

      const result = await db.transaction(async (tx) => {
        const [quizQuestionId] = await tx
          .update(quizQuestion)
          .set({
            question,
            points,
            required,
            imageBase64Jpg,
          })
          .where(eq(quizQuestion.id, id))
          .returning({ id: quizQuestion.id });
        if (!quizQuestionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Question not found",
          });
        }

        if (orderingOptions.length > 0) {
          // Filter out temp IDs - they don't exist in DB yet
          const realIdsToDelete = deletedChoiceIds.filter(
            (id) => !id.startsWith("temp_"),
          );
          if (realIdsToDelete.length > 0) {
            await tx
              .delete(quizOrderingItem)
              .where(inArray(quizOrderingItem.id, realIdsToDelete));
          }
        }
        const insertedChoices: { tempId: string; realId: string }[] = [];
        if (orderingOptions && orderingOptions.length > 0) {
          for (const options of orderingOptions) {
            const {
              orderingOptionId: id,
              itemText,
              points,
              correctPosition,
              imageBase64Jpg,
            } = options;
            // NEW: Check if it's a temp ID (new choice)
            if (id.startsWith("temp_")) {
              // INSERT new choice

              const [newChoice] = await tx
                .insert(quizOrderingItem)
                .values({
                  id: id.substring(5),
                  questionId: quizQuestionId.id,
                  itemText,
                  points,
                  correctPosition,
                  imageBase64Jpg,
                })
                .returning({ id: quizOrderingItem.id });

              insertedChoices.push({
                tempId: id,
                realId: newChoice.id,
              });
            } else {
              // UPDATE existing choice
              await tx
                .update(quizOrderingItem)
                .set({
                  questionId: quizQuestionId.id,
                  itemText,
                  points,
                  correctPosition,
                  imageBase64Jpg,
                })
                .where(eq(quizOrderingItem.id, id));
            }
          }
        }
        return { insertedChoices };
      });

      return { success: true, insertedChoices: result.insertedChoices };
    }),
  getTrueOrFalseQuestionDetails: adminProcedure
    .input(z.object({ quizQuestionId: z.number() }))
    .query(async ({ input }) => {
      const { quizQuestionId } = input;

      const [trueOrFalseQuestion] = await db
        .select({
          id: quizQuestion.id,
          question: quizQuestion.question,
          points: quizQuestion.points,
          orderIndex: quizQuestion.orderIndex,
          required: quizQuestion.required,
          correctBoolean: quizQuestion.correctBoolean,
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, quizQuestionId));

      return trueOrFalseQuestion;
    }),
  updateTrueOrFalseQuestionDetails: adminProcedure
    .input(updateTrueOrFalseQuestionDetailsSchema)
    .mutation(async ({ input }) => {
      const { id, question, points, required, correctBoolean, imageBase64Jpg } =
        input;

      await db
        .update(quizQuestion)
        .set({
          question,
          points,
          required,
          correctBoolean,
          imageBase64Jpg,
        })
        .where(eq(quizQuestion.id, id));
    }),
  getEssayQuestionDetails: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id } = input;
      const [essayDetails] = await db
        .select({
          id: quizQuestion.id,
          question: quizQuestion.question,
          points: quizQuestion.points,
          required: quizQuestion.required,
          orderIndex: quizQuestion.orderIndex,
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.id, id));

      return essayDetails;
    }),
  updateEssayQuestionDetails: adminProcedure
    .input(updateEssayQuestionDetailSchema)
    .mutation(async ({ input }) => {
      const { id, question, points, required, imageBase64Jpg } = input;

      await db
        .update(quizQuestion)
        .set({
          question,
          points,
          required,
          imageBase64Jpg,
        })
        .where(eq(quizQuestion.id, id));
    }),
  deleteQuestion: adminProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id } = input;
      await db.transaction(async (tx) => {
        // 1. Get the question details first (to know quizId and current order)
        const [questionToDelete] = await tx
          .select({
            quizId: quizQuestion.quizId,
            orderIndex: quizQuestion.orderIndex,
          })
          .from(quizQuestion)
          .where(eq(quizQuestion.id, id));

        if (!questionToDelete) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Question not found",
          });
        }

        // 2. Delete the question
        await tx.delete(quizQuestion).where(eq(quizQuestion.id, id));

        // 3. Decrement orderIndex for all questions that came after the deleted one
        await tx
          .update(quizQuestion)
          .set({
            orderIndex: sql`${quizQuestion.orderIndex} - 1`,
          })
          .where(
            and(
              eq(quizQuestion.quizId, questionToDelete.quizId),
              gt(quizQuestion.orderIndex, questionToDelete.orderIndex),
            ),
          );
      });
    }),
};
