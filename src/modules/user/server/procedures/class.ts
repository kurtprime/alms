import {
  assignmentDocument,
  classSubjects,
  comment,
  lesson,
  lessonDocument,
  lessonType,
  markAsDone,
  member,
  organization,
  privacyEnum,
  quiz,
  quizAttempt,
  user,
} from "@/db/schema";
import { db } from "@/index";
import { serializeMDX } from "@/lib/mdx";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNotNull,
  not,
  or,
  SQL,
  sql,
  desc,
} from "drizzle-orm";
import z from "zod";
import { lessonTypeOptionSchema } from "../userSchema";

export const classActions = {
  getAllStudentsInClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { classId } = input;
      const { auth } = ctx;

      const students = await db
        .selectDistinct({
          ...getTableColumns(member),
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userInitial: user.middleInitial,
          userImage: user.image,
        })
        .from(classSubjects)
        .innerJoin(
          organization,
          eq(classSubjects.enrolledClass, organization.id),
        )
        .innerJoin(member, eq(member.organizationId, organization.id))
        .innerJoin(user, eq(member.userId, user.id))
        .where(
          and(
            eq(member.role, "student"),
            eq(classSubjects.id, classId),
            or(
              exists(
                db
                  .select({ id: member.id })
                  .from(member)
                  .innerJoin(
                    classSubjects,
                    eq(member.organizationId, classSubjects.enrolledClass),
                  )
                  .where(
                    and(
                      eq(member.userId, auth.user.id),
                      eq(classSubjects.id, classId),
                    ),
                  ),
              ),
              eq(classSubjects.teacherId, auth.user.id),
            ),
          ),
        );

      return students;
    }),
  getAllLessonsWithContentsInClass: protectedProcedure
    .input(z.object({ classId: z.string(), lessonTypeId: z.int().optional() }))
    .query(async ({ input, ctx }) => {
      const { classId, lessonTypeId } = input;
      const isTeacher = ctx.auth.user.role === "teacher";

      //TODO: increase the security level for un enrolled students

      // 1. Get lessons based on role
      const lessons = await db
        .select({
          id: lesson.id,
          name: lesson.name,
          term: lesson.terms,
          classSubjectId: lesson.classSubjectId,
          status: lesson.status,
          createdAt: lesson.createdAt,
        })
        .from(lesson)
        .where(
          isTeacher
            ? eq(lesson.classSubjectId, classId)
            : and(eq(lesson.classSubjectId, classId)),
        );

      if (lessons.length === 0) return [];

      // 2. Get all lesson types for these lessons
      const lessonIds = lessons.map((l) => l.id);

      const allLessonTypes = await db
        .select()
        .from(lessonType)
        .where(
          isTeacher
            ? inArray(lessonType.lessonId, lessonIds)
            : and(
                inArray(lessonType.lessonId, lessonIds),
                eq(lessonType.status, "published"),
              ),
        );

      if (allLessonTypes.length === 0) {
        return lessons.map((l) => ({
          ...l,
          lessonTypes: [],
        }));
      }

      // 3. Get all documents for these lesson types
      const lessonTypeIds = allLessonTypes.map((lt) => lt.id);

      const allDocuments = await db
        .select()
        .from(lessonDocument)
        .where(inArray(lessonDocument.lessonTypeId, lessonTypeIds));

      // 4. Separate quiz and assignment type IDs
      const quizTypeIds = allLessonTypes
        .filter((lt) => lt.type === "quiz")
        .map((lt) => lt.id);

      const assignmentTypeIds = allLessonTypes
        .filter((lt) => lt.type === "assignment")
        .map((lt) => lt.id);

      // 5. Get quiz settings (quiz-specific fields)
      const allQuizSettings =
        quizTypeIds.length > 0
          ? await db
              .select({
                lessonTypeId: quiz.lessonTypeId,
                timeLimit: quiz.timeLimit,
                maxAttempts: quiz.maxAttempts,
                shuffleQuestions: quiz.shuffleQuestions,
                showScoreAfterSubmission: quiz.showScoreAfterSubmission,
                showCorrectAnswers: quiz.showCorrectAnswers,
                startDate: quiz.startDate,
                endDate: quiz.endDate,
              })
              .from(quiz)
              .where(inArray(quiz.lessonTypeId, quizTypeIds))
          : [];

      // 6. Get assignment settings (assignment-specific fields)
      const allAssignmentSettings =
        assignmentTypeIds.length > 0
          ? await db
              .select({
                lessonTypeId: quiz.lessonTypeId,
                maxAttempts: quiz.maxAttempts,
                score: quiz.score,
                startDate: quiz.startDate,
                endDate: quiz.endDate,
              })
              .from(quiz)
              .where(inArray(quiz.lessonTypeId, assignmentTypeIds))
          : [];

      // 7. Serialize MDX and attach documents + settings
      const lessonTypesWithSerializedMDXAndDocs = await Promise.all(
        allLessonTypes.map(async (item) => {
          const documents = allDocuments.filter(
            (doc) => doc.lessonTypeId === item.id,
          );

          // Get quiz settings if type is quiz
          const quizSettings =
            item.type === "quiz"
              ? (allQuizSettings.find((qs) => qs.lessonTypeId === item.id) ??
                null)
              : null;

          // Get assignment settings if type is assignment
          const assignmentSettings =
            item.type === "assignment"
              ? (allAssignmentSettings.find(
                  (as) => as.lessonTypeId === item.id,
                ) ?? null)
              : null;

          return {
            ...item,
            serializedMarkup: await serializeMDX(item.markup ?? ""),
            documents,
            quizSettings,
            assignmentSettings,
          };
        }),
      );

      // 8. Map lessons with their lesson types
      const lessonsWithTypes = lessons.map((l) => ({
        ...l,
        lessonTypes: lessonTypesWithSerializedMDXAndDocs.filter(
          (lt) => lt.lessonId === l.id,
        ),
      }));

      return lessonsWithTypes;
    }),
  getAllLessonsInClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher")
        throw new TRPCError({ code: "FORBIDDEN", message: "Not Authorize" });
      //todo: create a more secure way of fetching lesson from teachers to student
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
            isNotNull(lesson.terms),
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
  getLessonHandout: protectedProcedure
    .input(lessonTypeOptionSchema)
    .query(async ({ ctx, input }) => {
      //TODO: Increase the security for student's who aren't enrolled in this class
      const { classId, lessonTypeId } = input;

      // 1. Fetch the LessonType and verify it belongs to the provided classId
      // We join with the 'lesson' table to ensure the classId matches
      const [result] = await db
        .select()
        .from(lessonType)
        .innerJoin(lesson, eq(lessonType.lessonId, lesson.id))
        .where(
          and(
            eq(lessonType.id, lessonTypeId),
            eq(lessonType.type, "handout"),
            eq(lesson.classSubjectId, classId),
            eq(lessonType.status, "published"),
          ),
        );

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson Handout not found",
        });
      }

      const item = result.lesson_type;

      // 2. Fetch associated documents
      const documents = await db
        .select()
        .from(lessonDocument)
        .where(eq(lessonDocument.lessonTypeId, item.id));

      // 3. Serialize MDX
      const serializedMarkup = await serializeMDX(item.markup ?? "");

      // 4. Return the object in the same format as the first function
      return {
        ...item,
        serializedMarkup,
        documents,
      };
    }),
  upsertMarkAsDone: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { lessonTypeId } = input;
      const userId = ctx.auth.user.id; // Get the current user's ID

      // 1. Try to Insert
      // If the unique constraint (userId + lessonTypeId) conflicts, run the Update instead.
      const [record] = await db
        .insert(markAsDone)
        .values({
          userId,
          isDone: true,
          lessonTypeId,
        })
        .onConflictDoUpdate({
          // The target columns that define the conflict (must match your unique index)
          target: [markAsDone.userId, markAsDone.lessonTypeId],
          // What to update if the record already exists
          set: {
            isDone: sql`NOT ${markAsDone.isDone}`,
            updatedAt: new Date(),
          },
        })
        .returning({
          isDone: markAsDone.isDone,
        });

      return record.isDone;
    }),
  getMarkIsDone: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { lessonTypeId } = input;
      const { auth } = ctx;

      const [result] = await db
        .select()
        .from(markAsDone)
        .where(
          and(
            eq(markAsDone.lessonTypeId, lessonTypeId),
            eq(markAsDone.userId, auth.user.id),
          ),
        );

      return result?.isDone ?? false;
    }),
  upsertCommentInLessonType: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        privacy: z.enum(privacyEnum.enumValues),
        lessonTypeId: z.number(),
        text: z.string().min(2).max(2000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.user.id;
      const { id, privacy, lessonTypeId, text } = input;

      // 1. UPDATE: If ID exists, find and update the comment
      if (id) {
        const [updatedComment] = await db
          .update(comment)
          .set({
            text,
            updatedAt: new Date(), // Manually update timestamp on edit
          })
          .where(
            // Security: Ensure the user owns this comment
            and(
              eq(comment.id, id),
              eq(comment.userId, userId),
              eq(comment.privacy, privacy),
            ),
          )
          .returning();

        // If nothing returned, the ID didn't exist OR user didn't own it
        if (!updatedComment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Comment not found or you do not have permission to edit it.",
          });
        }

        return updatedComment;
      }

      // 2. CREATE: If no ID, insert a new comment
      const [newComment] = await db
        .insert(comment)
        .values({
          userId,
          lessonTypeId,
          text,
          privacy,
        })
        .returning();

      return newComment;
    }),
  getCommentsInLessonType: protectedProcedure
    .input(
      z.object({
        privacy: z.enum(privacyEnum.enumValues),
        lessonTypeId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { lessonTypeId, privacy } = input;
      const currentUserId = ctx.auth.user.id;

      // Prepare the base conditions
      const conditions = [
        eq(comment.lessonTypeId, lessonTypeId),
        eq(comment.privacy, privacy), // Filter by the requested privacy type
      ];

      // SECURITY CHECK:
      // If the user is asking for 'private' comments,
      // we MUST ensure they are the Author or the Teacher.
      if (privacy === "private") {
        conditions.push(
          or(
            eq(comment.userId, currentUserId),
            eq(classSubjects.teacherId, currentUserId),
          ) as SQL<unknown>,
        );
      }

      const result = await db
        .select({
          id: comment.id,
          text: comment.text,
          privacy: comment.privacy,
          lessonTypeId: comment.lessonTypeId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          userId: comment.userId,
          user: {
            name: user.name,
            image: user.image,
          },
        })
        .from(comment)
        .innerJoin(user, eq(comment.userId, user.id))
        .innerJoin(lessonType, eq(comment.lessonTypeId, lessonType.id))
        .innerJoin(lesson, eq(lessonType.lessonId, lesson.id))
        .innerJoin(classSubjects, eq(lesson.classSubjectId, classSubjects.id))
        .where(and(...conditions)) // Spread the conditions array
        .orderBy(comment.createdAt);

      return result;
    }),
  getLessonAssignment: protectedProcedure
    .input(lessonTypeOptionSchema)
    .query(async ({ ctx, input }) => {
      //TODO: Increase the security for student's who aren't enrolled in this class
      const { classId, lessonTypeId } = input;
      const userId = ctx.auth.user.id;
      // 1. Fetch Lesson Details, Settings, and Teacher Documents
      const rows = await db
        .select({
          // LessonType
          id: lessonType.id,
          name: lessonType.name,
          markup: lessonType.markup,
          status: lessonType.status,
          createdAt: lessonType.createdAt,
          type: lessonType.type,
          // Lesson
          classSubjectId: lesson.classSubjectId,
          // Quiz Settings
          maxAttempts: quiz.maxAttempts,
          score: quiz.score,
          endDate: quiz.endDate,
          quizId: quiz.id,
          // Teacher Documents
          document: {
            id: lessonDocument.id,
            name: lessonDocument.name,
            fileUrl: lessonDocument.fileUrl,
            fileType: lessonDocument.fileType,
            size: lessonDocument.size,
            fileKey: lessonDocument.fileKey,
            fileUfsUrl: lessonDocument.fileUfsUrl,
            uploadedAt: lessonDocument.uploadedAt,
            fileHash: lessonDocument.fileHash,
            lessonTypeId: lessonDocument.lessonTypeId,
          },
        })
        .from(lessonType)
        .innerJoin(lesson, eq(lesson.id, lessonType.lessonId))
        .innerJoin(quiz, eq(quiz.lessonTypeId, lessonType.id))
        .leftJoin(
          lessonDocument,
          eq(lessonDocument.lessonTypeId, lessonType.id),
        )
        .where(
          and(
            eq(lessonType.id, lessonTypeId),
            eq(lessonType.type, "assignment"),
            eq(lesson.classSubjectId, classId),
            eq(lessonType.status, "published"),
          ),
        );

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      const baseData = rows[0];
      const quizId = baseData.quizId;

      // 2. Fetch Student's Attempts and their Uploaded Documents
      const attemptRows = await db
        .select({
          // Attempt Fields
          attemptId: quizAttempt.id,
          attemptNumber: quizAttempt.attemptNumber,
          score: quizAttempt.score,
          submittedAt: quizAttempt.submittedAt,
          status: quizAttempt.status,
          // Document Fields
          document: {
            id: assignmentDocument.id,
            name: assignmentDocument.name,
            fileUrl: assignmentDocument.fileUrl,
            fileType: assignmentDocument.fileType,
            size: assignmentDocument.size,
            fileKey: assignmentDocument.fileKey,
            fileUfsUrl: assignmentDocument.fileUfsUrl,
            uploadedAt: assignmentDocument.uploadedAt,
            fileHash: assignmentDocument.fileHash,
          },
        })
        .from(quizAttempt)
        .leftJoin(
          assignmentDocument,
          eq(assignmentDocument.quizAttemptId, quizAttempt.id),
        )
        .where(
          and(
            eq(quizAttempt.quizId, quizId),
            eq(quizAttempt.studentId, userId),
          ),
        )
        .orderBy(desc(quizAttempt.createdAt));

      // 3. Process/Group the data

      // Group Teacher Documents
      const documents = rows
        .map((row) => row.document)
        .filter((doc): doc is NonNullable<typeof doc> => doc !== null);

      // --- STRICT TYPING START ---

      // Extract the document type from the query result
      type AssignmentDocType = NonNullable<
        (typeof attemptRows)[number]["document"]
      >;

      // Define the shape of the final Attempt object
      type ProcessedAttempt = Omit<(typeof attemptRows)[number], "document"> & {
        documents: AssignmentDocType[];
      };

      const attemptsMap = new Map<number, ProcessedAttempt>();

      attemptRows.forEach((row) => {
        const existingAttempt = attemptsMap.get(row.attemptId);

        if (existingAttempt) {
          // If attempt exists, just push the document
          if (row.document?.id) {
            existingAttempt.documents.push(row.document);
          }
        } else {
          // If attempt doesn't exist, create it
          const newAttempt: ProcessedAttempt = {
            attemptId: row.attemptId,
            attemptNumber: row.attemptNumber,
            score: row.score,
            submittedAt: row.submittedAt,
            status: row.status,
            documents: [], // Initialize empty array
          };

          // Add document if it exists
          if (row.document?.id) {
            newAttempt.documents.push(row.document);
          }

          attemptsMap.set(row.attemptId, newAttempt);
        }
      });

      const attempts = Array.from(attemptsMap.values());

      // --- STRICT TYPING END ---

      // 4. Serialize MDX
      const serializedMarkup = await serializeMDX(baseData.markup ?? "");

      // 5. Return combined object
      return {
        id: baseData.id,
        name: baseData.name,
        createdAt: baseData.createdAt,
        status: baseData.status,
        type: baseData.type,
        lessonId: baseData.classSubjectId,
        markup: baseData.markup,
        documents: documents,
        assignmentSettings: {
          maxAttempts: baseData.maxAttempts,
          scores: baseData.score,
          endDate: baseData.endDate,
          quidId: baseData.quizId,
        },
        serializedMarkup,
        attempts: attempts,
      };
    }),
  getSubmittedOutputs: protectedProcedure
    .input(lessonTypeOptionSchema.extend({ quizId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { classId, lessonTypeId, quizId } = input;

      const { auth } = ctx;

      const result = await db
        .select({
          id: quizAttempt.id,
          attemptNumber: quizAttempt.attemptNumber,
          score: quizAttempt.score,
          submittedAt: quizAttempt.submittedAt,
          assignmentDocument: assignmentDocument,
        })
        .from(quizAttempt)
        .leftJoin(
          assignmentDocument,
          eq(assignmentDocument.quizAttemptId, quizAttempt.id),
        )
        .where(
          and(
            eq(quizAttempt.studentId, auth.user.id),
            eq(quizAttempt.quizId, quizId),
          ),
        );

      return result;
    }),
};
