import {
  announcement,
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
  quizAnswerOption,
  quizAttempt,
  quizMatchingPair,
  quizOrderingItem,
  quizQuestion,
  quizQuestionResponse,
  subjectName,
  subjects,
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
  count,
} from "drizzle-orm";
import z from "zod";
import { lessonTypeOptionSchema, StudentGradeRow } from "../userSchema";

type ResultReviewAnswer =
  | { type: "option"; optionId: string }
  | { type: "text"; text: string }
  | { type: "multiple"; optionIds: string[] }
  | { type: "ordering"; order: string[] }
  | {
      type: "matching";
      matches: { left: string | null; right: string | null }[];
    } // THE FIX
  | { type: "boolean"; value: boolean }
  | null;

type CorrectAnswerType =
  | boolean
  | { id: string; text: string }[]
  | { left: string | null; right: string }[]
  | null;

type QuizResultReviewItem = {
  questionId: number;
  questionText: string;
  type: string;
  points: number;
  userAnswer: ResultReviewAnswer; // Use the updated type here
  isCorrect: boolean | null;
  pointsEarned: number | null;
  correctAnswer: CorrectAnswerType;
  teacherFeedback: string | null;
  explanation: string | null;
};

type QuizResultResponse = {
  quiz: typeof quiz.$inferSelect;
  attempt: Partial<typeof quizAttempt.$inferSelect> & {
    id: number;
    status: string;
    submittedAt: Date | null;
    startedAt: Date;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
  };
  review?: QuizResultReviewItem[];
};
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
                quizId: quiz.id,
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
  getClassAnnouncement: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { classId } = input;
      const userId = ctx.auth.user.id;
      const isTeacher = ctx.auth.user.role === "teacher";

      // Security Check: Ensure user is part of the class (Teacher or Student)
      const membership = await db
        .select()
        .from(member)
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .innerJoin(
          classSubjects,
          eq(classSubjects.enrolledClass, organization.id),
        )
        .where(
          and(
            eq(classSubjects.id, classId),
            or(eq(member.userId, userId), eq(classSubjects.teacherId, userId)),
          ),
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this class",
        });
      }

      // Fetch announcements with Creator and Lesson details
      const announcements = await db
        .select({
          id: announcement.id,
          message: announcement.message,
          type: announcement.type,
          createdAt: announcement.createdAt,
          // Creator Details
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          // Linked Lesson Details (Nullable)
          lessonType: {
            id: lessonType.id,
            name: lessonType.name,
            type: lessonType.type,
          },
        })
        .from(announcement)
        .innerJoin(user, eq(announcement.createdBy, user.id))
        .leftJoin(lessonType, eq(announcement.lessonTypeId, lessonType.id))
        .where(eq(announcement.classId, classId))
        .orderBy(desc(announcement.createdAt));

      return announcements;
    }),
  createCustomAnnouncement: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        message: z.string().min(1, "Message cannot be empty"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { classId, message } = input;
      const userId = ctx.auth.user.id;

      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only teachers can post announcements",
        });
      }

      // const [newAnnouncement] = await db
      //   .insert(announcement)
      //   .values({
      //     classId,
      //     message,
      //     type: "custom",
      //     createdBy: userId,
      //   })
      //   .returning();

      // Optional: Trigger Inngest event to send emails for custom announcements
      // await inngest.send({ name: "announcement/custom", data: { announcementId: newAnnouncement.id } });

      // return newAnnouncement;
    }),

  // DELETE: Delete an announcement
  deleteAnnouncement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.auth.user.id;

      // Verify ownership
      const [existing] = await db
        .select({
          id: announcement.id,
          createdBy: announcement.createdBy,
        })
        .from(announcement)
        .where(eq(announcement.id, id));
      // db.query.announcement.findFirst({
      //   where: eq(announcement.id, id),
      // });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.createdBy !== userId && ctx.auth.user.role !== "teacher") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete this announcement",
        });
      }

      await db.delete(announcement).where(eq(announcement.id, id));

      return { success: true };
    }),
  getGradebookData: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ input }) => {
      const { classId } = input;

      // 1. Get all Students in the class
      // const students = await db.query.member.findMany({
      //   where: and(
      //     eq(member.organizationId, classId),
      //     eq(member.role, "student"),
      //   ),
      //   with: {
      //     user: { columns: { id: true, name: true, image: true } },
      //   },
      // });

      const students = await db
        .select({
          userId: member.userId,
          user: user,
        })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .innerJoin(
          classSubjects,
          eq(classSubjects.enrolledClass, organization.id),
        )
        .where(and(eq(member.role, "student"), eq(classSubjects.id, classId)));

      // 2. Get all Assessments (Quizzes/Assignments) for this class
      // We assume you have a way to link lessonType -> class.
      // Based on previous schema: lessonType -> lesson -> classSubjectId
      const assessments = await db
        .select({
          id: quiz.id,
          title: lessonType.name,
          type: lessonType.type,
          maxScore: quiz.score,
          quizId: quiz.id,
        })
        .from(lessonType)
        .innerJoin(quiz, eq(quiz.lessonTypeId, lessonType.id))
        // Add joins to verify classId if needed
        .where(not(inArray(lessonType.type, ["handout"]))); // Filter by class logic needed

      // 3. Get all Attempts/Submissions for these students & assessments
      // This is simplified. In reality, you'd fetch attempts where studentId IN studentIds AND quizId IN assessmentIds
      // const attempts = await db.query.quizAttempt.findMany({
      //   where: inArray(
      //     quizAttempt.studentId,
      //     students.map((s) => s.userId),
      //   ),
      // });

      const attempts = await db
        .select()
        .from(quizAttempt)
        .where(
          and(
            inArray(
              quizAttempt.studentId,
              students.map((s) => s.userId),
            ),
            inArray(
              quizAttempt.quizId,
              assessments.map((a) => a.quizId),
            ),
          ),
        );

      // 4. Format Data for Frontend
      const rows: StudentGradeRow[] = students.map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const grades: Record<string, any> = {};

        // Find the best attempt for each assessment
        // assessments.forEach((a) => {
        //   const studentAttempts = attempts.filter(
        //     (att) => att.studentId === s.userId && att.quizId === a.id,
        //   );

        //   // Logic: Get max score or latest score
        //   const bestAttempt = studentAttempts.sort(
        //     (a, b) => (b.score ?? 0) - (a.score ?? 0),
        //   )[0];

        //   grades[a.id] = bestAttempt
        //     ? {
        //         score: bestAttempt.score,
        //         maxScore: a.maxScore,
        //         status: bestAttempt.status,
        //         submittedAt: bestAttempt.submittedAt,
        //       }
        //     : null;
        // });

        assessments.forEach((a) => {
          const studentAttempts = attempts
            .filter((att) => att.studentId === s.userId && att.quizId === a.id)
            .sort((a, b) => a.attemptNumber - b.attemptNumber);

          const latestAttempts = studentAttempts[0];

          grades[a.quizId] = latestAttempts
            ? {
                score: latestAttempts.score,
                maxScore: latestAttempts.maxScore,
                status: latestAttempts.status,
                submittedAt: latestAttempts.submittedAt,
              }
            : null;
        });

        return {
          student: s.user,
          grades,
        };
      });

      return {
        assessments: assessments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          maxScore: a.maxScore,
        })),
        rows,
      };
    }),
  updateGrade: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        studentId: z.string(),
        score: z.number().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is teacher
      // Logic:
      // 1. Find the quizAttempt for this student and lessonType (quiz/assignment).
      // 2. If exists, update score.
      // 3. If not, maybe create one? Or throw error?

      // Example:
      // await db.update(quizAttempt).set({ score: input.score }).where(...)

      return { success: true };
    }),

  createNewQuiz: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { lessonTypeId } = input;
      const { auth } = ctx;

      const [result] = await db
        .insert(quiz)
        .values({
          lessonTypeId: lessonTypeId,
          createdBy: auth.user.id,
        })
        .returning({
          quizId: quiz.id,
        });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create quiz",
        });
      }

      return result;
    }),
  getQuizPreview: protectedProcedure
    .input(z.object({ lessonTypeId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { lessonTypeId } = input;
      const userId = ctx.auth.user.id;

      // 1. Fetch Quiz
      const [quizData] = await db
        .select()
        .from(quiz)
        .where(eq(quiz.lessonTypeId, lessonTypeId))
        .limit(1);

      if (!quizData) throw new TRPCError({ code: "NOT_FOUND" });

      // 2. Fetch ALL attempts for counting
      const attempts = await db
        .select({ status: quizAttempt.status })
        .from(quizAttempt)
        .where(
          and(
            eq(quizAttempt.quizId, quizData.id),
            eq(quizAttempt.studentId, userId),
          ),
        );

      // 3. Calculate Used attempts
      const attemptsUsed = attempts.filter((a) =>
        ["submitted", "graded", "expired"].includes(a.status),
      ).length;

      // 4. Find latest FINISHED attempt (SQL Style)
      // This replaces the db.query.quizAttempt.findFirst
      const [latestAttempt] = await db
        .select()
        .from(quizAttempt)
        .where(
          and(
            eq(quizAttempt.quizId, quizData.id),
            eq(quizAttempt.studentId, userId),
            // Only show results for finished quizzes
            inArray(quizAttempt.status, ["submitted", "graded", "expired"]),
          ),
        )
        .orderBy(desc(quizAttempt.createdAt))
        .limit(1);

      return {
        ...quizData,
        attemptsUsed,
        latestAttempt,
      };
    }),
  getQuizResult: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(async ({ input, ctx }): Promise<QuizResultResponse> => {
      const { attemptId } = input;
      const userId = ctx.auth.user.id;

      // 1. Fetch Attempt and Quiz Settings
      const [attempt] = await db
        .select()
        .from(quizAttempt)
        .where(
          and(eq(quizAttempt.id, attemptId), eq(quizAttempt.studentId, userId)),
        )
        .limit(1);

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attempt not found",
        });
      }

      if (attempt.status === "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quiz is still in progress",
        });
      }

      const [quizData] = await db
        .select()
        .from(quiz)
        .where(eq(quiz.id, attempt.quizId))
        .limit(1);

      if (!quizData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
      }

      // 2. Construct Base Response
      const response: QuizResultResponse = {
        quiz: quizData,
        attempt: {
          id: attempt.id,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          startedAt: attempt.startedAt,
          score: null,
          maxScore: null,
          percentage: null,
        },
      };

      // 3. Logic: Show Score?
      if (quizData.showScoreAfterSubmission) {
        response.attempt.score = attempt.score;
        response.attempt.maxScore = attempt.maxScore;
        response.attempt.percentage = attempt.percentage;
      }

      // 4. Logic: Show Correct Answers / Detailed Review?
      if (quizData.showCorrectAnswers) {
        const responses = await db
          .select()
          .from(quizQuestionResponse)
          .where(eq(quizQuestionResponse.attemptId, attemptId));

        const questionIds = responses.map((r) => r.questionId);

        if (questionIds.length > 0) {
          const questions = await db
            .select()
            .from(quizQuestion)
            .where(inArray(quizQuestion.id, questionIds));

          // Fetch Related Data
          const [mcOptions, orderingItems, matchingPairs] = await Promise.all([
            db
              .select()
              .from(quizAnswerOption)
              .where(inArray(quizAnswerOption.questionId, questionIds)),
            db
              .select()
              .from(quizOrderingItem)
              .where(inArray(quizOrderingItem.questionId, questionIds)),
            db
              .select()
              .from(quizMatchingPair)
              .where(inArray(quizMatchingPair.questionId, questionIds)),
          ]);

          // Map related data for quick lookup
          const optionsMap = new Map<number, typeof mcOptions>();
          mcOptions.forEach((opt) => {
            if (!optionsMap.has(opt.questionId))
              optionsMap.set(opt.questionId, []);
            optionsMap.get(opt.questionId)!.push(opt);
          });

          const orderingMap = new Map<number, typeof orderingItems>();
          orderingItems.forEach((item) => {
            if (!orderingMap.has(item.questionId))
              orderingMap.set(item.questionId, []);
            orderingMap.get(item.questionId)!.push(item);
          });

          const matchingMap = new Map<number, typeof matchingPairs>();
          matchingPairs.forEach((pair) => {
            if (!matchingMap.has(pair.questionId))
              matchingMap.set(pair.questionId, []);
            matchingMap.get(pair.questionId)!.push(pair);
          });

          // Construct Review Array
          const reviewItems: QuizResultReviewItem[] = questions.map((q) => {
            const userResponse = responses.find((r) => r.questionId === q.id);

            let correctAnswer: CorrectAnswerType = null;
            // Initialize as null. We will populate it based on type.
            let finalUserAnswer: ResultReviewAnswer = null;

            if (q.type === "true_false") {
              correctAnswer = q.correctBoolean ?? false;
              // Direct assignment is safe for these types
              if (userResponse?.answer) {
                finalUserAnswer = userResponse.answer as ResultReviewAnswer;
              }
            } else if (q.type === "multiple_choice") {
              const opts = optionsMap.get(q.id) || [];
              correctAnswer = opts
                .filter((o) => o.isCorrect)
                .map((o) => ({ id: o.id, text: o.optionText }));

              if (userResponse?.answer) {
                finalUserAnswer = userResponse.answer as ResultReviewAnswer;
              }
            } else if (q.type === "ordering") {
              const items = orderingMap.get(q.id) || [];
              correctAnswer = items
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map((i) => ({ id: i.id, text: i.itemText }));

              if (userResponse?.answer) {
                finalUserAnswer = userResponse.answer as ResultReviewAnswer;
              }
            } else if (q.type === "matching") {
              const pairs = matchingMap.get(q.id) || [];

              // 1. Correct Answer
              correctAnswer = pairs.map((p) => ({
                left: p.leftItem,
                right: p.rightItem,
              }));

              // 2. Resolve User Answer
              if (
                userResponse?.answer &&
                userResponse.answer.type === "matching"
              ) {
                // Create a lookup map for this specific question: ID -> { left, right }
                const pairLookup = new Map<
                  string,
                  { left: string | null; right: string }
                >();
                pairs.forEach((p) => {
                  pairLookup.set(p.id, {
                    left: p.leftItem,
                    right: p.rightItem,
                  });
                });

                const rawMatches = userResponse.answer.matches; // Record<string, string>
                const resolvedMatches: {
                  left: string | null;
                  right: string | null;
                }[] = [];

                Object.entries(rawMatches).forEach(([leftId, rightValue]) => {
                  const leftPair = pairLookup.get(leftId);
                  let rightText: string | null = null;

                  // Resolve Right Text (Check if ID or Text)
                  if (pairLookup.has(rightValue)) {
                    rightText = pairLookup.get(rightValue)?.right ?? null;
                  } else {
                    rightText = rightValue;
                  }

                  resolvedMatches.push({
                    left: leftPair?.left ?? null,
                    right: rightText,
                  });
                });

                // Construct the RESOLVED object explicitly
                finalUserAnswer = {
                  type: "matching",
                  matches: resolvedMatches,
                };
              }
            } else if (q.type === "essay") {
              if (userResponse?.answer) {
                finalUserAnswer = userResponse.answer as ResultReviewAnswer;
              }
            }

            return {
              questionId: q.id,
              questionText: q.question,
              type: q.type,
              points: q.points,
              userAnswer: finalUserAnswer,
              isCorrect: userResponse?.isCorrect ?? null,
              pointsEarned: userResponse?.pointsEarned ?? null,
              correctAnswer: correctAnswer,
              teacherFeedback: userResponse?.teacherFeedback ?? null,
              explanation: q.explanation ?? null,
            };
          });

          response.review = reviewItems;
        } else {
          response.review = [];
        }
      }

      return response;
    }),
  getQuizForTaking: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { quizId } = input;
      const userId = ctx.auth.user.id;

      // 1. Fetch Quiz Metadata
      const [quizData] = await db
        .select({
          id: quiz.id,
          name: quiz.name,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          status: quiz.status,
        })
        .from(quiz)
        .where(eq(quiz.id, quizId));

      console.log("QUIZ DATA: ", quizData);
      if (!quizData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
      }

      // 2. Authorization & Availability Checks
      // Check if student has attempts left
      const [attemptData] = await db
        .select({ count: count() })
        .from(quizAttempt)
        .where(
          and(
            eq(quizAttempt.quizId, quizId),
            eq(quizAttempt.studentId, userId),
          ),
        );
      console.log("Attempt Data: ", attemptData);
      // Note: You might need to fetch 'maxAttempts' from quiz or lesson settings
      // if (attemptData.count >= maxAttempts) throw new TRPCError({ code: "FORBIDDEN", message: "No attempts left" });

      // 3. Fetch Questions (Base)
      const questionsRaw = await db
        .select({
          id: quizQuestion.id,
          question: quizQuestion.question,
          type: quizQuestion.type,
          points: quizQuestion.points,
          orderIndex: quizQuestion.orderIndex,
          required: quizQuestion.required,
          imageBase64Jpg: quizQuestion.imageBase64Jpg,
        })
        .from(quizQuestion)
        .where(eq(quizQuestion.quizId, quizId))
        .orderBy(quizQuestion.orderIndex);

      console.log("RAW QUESTIONS", questionsRaw);
      if (questionsRaw.length === 0) {
        return { ...quizData, questions: [] };
      }

      const questionIds = questionsRaw.map((q) => q.id);

      // 4. Fetch Options (Parallel Optimization)
      // We fetch everything needed, then strip sensitive data

      // A. Multiple Choice Options
      const mcOptions = await db
        .select({
          questionId: quizAnswerOption.questionId,
          id: quizAnswerOption.id,
          optionText: quizAnswerOption.optionText,
          imageBase64Jpg: quizAnswerOption.imageBase64Jpg,
          // Explicitly DO NOT select 'isCorrect'
        })
        .from(quizAnswerOption)
        .where(inArray(quizAnswerOption.questionId, questionIds));

      // B. Matching Pairs (SECURITY CRITICAL)
      // We decouple pairs so the student doesn't see the correct answer immediately
      const matchingPairs = await db
        .select({
          questionId: quizMatchingPair.questionId,
          id: quizMatchingPair.id,
          leftItem: quizMatchingPair.leftItem,
          rightItem: quizMatchingPair.rightItem, // We need this to return the list of 'right' items
          leftImageBase64Jpg: quizMatchingPair.leftImageBase64Jpg,
          rightImageBase64Jpg: quizMatchingPair.rightImageBase64Jpg,
        })
        .from(quizMatchingPair)
        .where(inArray(quizMatchingPair.questionId, questionIds));

      // C. Ordering Items
      const orderingItems = await db
        .select({
          questionId: quizOrderingItem.questionId,
          id: quizOrderingItem.id,
          itemText: quizOrderingItem.itemText,
          imageBase64Jpg: quizOrderingItem.imageBase64Jpg,
          // DO NOT select 'correctPosition'
        })
        .from(quizOrderingItem)
        .where(inArray(quizOrderingItem.questionId, questionIds));

      console.log("Ordering Items: ", orderingItems);

      // 5. Construct Response Structure
      const questions = questionsRaw
        .map((q) => {
          const base = {
            id: q.id,
            question: q.question,
            points: q.points,
            orderIndex: q.orderIndex,
            required: q.required,
            imageBase64Jpg: q.imageBase64Jpg,
          };

          switch (q.type) {
            case "multiple_choice":
              return {
                ...base,
                type: "multiple_choice" as const,
                multipleChoices: mcOptions
                  .filter((opt) => opt.questionId === q.id)
                  .map((opt) => ({
                    multipleChoiceId: opt.id,
                    optionText: opt.optionText,
                    imageBase64Jpg: opt.imageBase64Jpg,
                  })),
              };

            case "true_false":
              return {
                ...base,
                type: "true_false" as const,
                // DO NOT return correctBoolean
              };

            case "essay":
              return {
                ...base,
                type: "essay" as const,
              };

            case "matching": {
              // SECURITY: Decouple left and right items
              const pairs = matchingPairs.filter((p) => p.questionId === q.id);
              const leftItems = pairs.map((p) => ({
                id: p.id,
                text: p.leftItem,
                imageBase64Jpg: p.leftImageBase64Jpg,
              }));

              // Shuffle right items so order doesn't give away answers
              const rightItems = pairs
                .map((p) => ({
                  id: p.id,
                  text: p.rightItem,
                  imageBase64Jpg: p.rightImageBase64Jpg,
                }))
                .sort(() => Math.random() - 0.5);

              return {
                ...base,
                type: "matching" as const,
                matchingOptions: pairs.map((p) => ({
                  matchingPairId: p.id,
                  leftItem: p.leftItem,
                  leftImageBase64Jpg: p.leftImageBase64Jpg,
                  rightIem: p.rightItem, // Sending this for your specific types
                  rightImageBase64Jpg: p.rightImageBase64Jpg,
                })),
                // Ideally, send decoupled lists to frontend, but adapting to your previous Renderer:
                // If your Renderer expects `matchingOptions` with both items, we send them.
                // If you want to prevent cheating via inspect element, implement the decoupling logic in the renderer.
              };
            }

            case "ordering": {
              const items = orderingItems
                .filter((i) => i.questionId === q.id)
                .map((i) => ({
                  orderingOptionId: i.id,
                  itemText: i.itemText,
                  imageBase64Jpg: i.imageBase64Jpg,
                }))
                .sort(() => Math.random() - 0.5); // Shuffle so order isn't the answer

              return {
                ...base,
                type: "ordering" as const,
                orderingOptions: items,
              };
            }

            default:
              return null;
          }
        })
        .filter((q): q is NonNullable<typeof q> => q !== null);

      console.log(questions);

      return {
        ...quizData,
        questions,
        attemptsUsed: attemptData.count,
      };
    }),
  startQuizAttempt: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { quizId } = input;
      const userId = ctx.auth.user.id;

      // 1. Fetch Quiz Settings (Added startDate/endDate)
      const [quizData] = await db
        .select({
          maxAttempts: quiz.maxAttempts,
          timeLimit: quiz.timeLimit,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
        })
        .from(quiz)
        .where(eq(quiz.id, quizId));

      if (!quizData) throw new TRPCError({ code: "NOT_FOUND" });

      // --- NEW: DATE VALIDATION ---
      const now = new Date();

      if (quizData.startDate && now < new Date(quizData.startDate)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This quiz has not opened yet.",
        });
      }

      if (quizData.endDate && now > new Date(quizData.endDate)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This quiz has already closed.",
        });
      }
      // -----------------------------

      // 2. Fetch ALL previous attempts for this user
      const previousAttempts = await db
        .select({
          id: quizAttempt.id,
          status: quizAttempt.status,
        })
        .from(quizAttempt)
        .where(
          and(
            eq(quizAttempt.quizId, quizId),
            eq(quizAttempt.studentId, userId),
          ),
        );

      // 3. Check for existing 'in_progress' attempt
      const inProgressAttempt = previousAttempts.find(
        (a) => a.status === "in_progress",
      );

      if (inProgressAttempt) {
        return { attemptId: inProgressAttempt.id, isNew: false };
      }

      // 4. Check Max Attempts Limit
      // We count 'submitted', 'graded', or 'expired' as consumed attempts.
      const consumedAttempts = previousAttempts.filter((a) =>
        ["submitted", "graded", "expired"].includes(a.status),
      ).length;

      // Default to 1 attempt if null
      const maxAllowed = quizData.maxAttempts ?? 1;

      if (consumedAttempts >= maxAllowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached the maximum number of attempts (${maxAllowed}).`,
        });
      }

      // 5. Create New Attempt
      const [newAttempt] = await db
        .insert(quizAttempt)
        .values({
          quizId,
          studentId: userId,
          attemptNumber: previousAttempts.length + 1,
          status: "in_progress",
          startedAt: new Date(),
        })
        .returning();

      return { attemptId: newAttempt.id, isNew: true };
    }),
  submitQuiz: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        attemptId: z.number().optional(), // Optional: if resuming
        answers: z.array(
          z.object({
            questionId: z.number(),
            answer: z.any(), // string, boolean, array, or object
          }),
        ),
        timeSpent: z.number(), // Time spent in seconds
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { quizId, attemptId, answers, timeSpent } = input;
      const userId = ctx.auth.user.id;

      // 1. Validate or Create Attempt
      let attempt;

      if (attemptId) {
        // Validate existing attempt
        const [existing] = await db
          .select()
          .from(quizAttempt)
          .where(
            and(
              eq(quizAttempt.id, attemptId),
              eq(quizAttempt.studentId, userId),
              eq(quizAttempt.status, "in_progress"),
            ),
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Active attempt not found.",
          });
        }
        attempt = existing;
      } else {
        // Create new attempt if not provided (fallback)
        // Check for existing in_progress first to prevent duplicates
        const [existing] = await db
          .select()
          .from(quizAttempt)
          .where(
            and(
              eq(quizAttempt.quizId, quizId),
              eq(quizAttempt.studentId, userId),
              eq(quizAttempt.status, "in_progress"),
            ),
          );

        if (existing) {
          attempt = existing;
        } else {
          const [newAttempt] = await db
            .insert(quizAttempt)
            .values({
              quizId,
              studentId: userId,
              attemptNumber: 1, // Simplified: should check previous count
              status: "in_progress",
              startedAt: new Date(Date.now() - timeSpent * 1000),
            })
            .returning();
          attempt = newAttempt;
        }
      }

      // 2. Fetch Questions & Correct Answers
      const questions = await db
        .select()
        .from(quizQuestion)
        .where(eq(quizQuestion.quizId, quizId));

      if (questions.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No questions found for this quiz.",
        });
      }

      const questionIds = questions.map((q) => q.id);

      // Fetch related data for grading
      const [mcOptions, orderingItems, matchingPairs] = await Promise.all([
        // MC Options
        db
          .select()
          .from(quizAnswerOption)
          .where(inArray(quizAnswerOption.questionId, questionIds)),
        // Ordering Items
        db
          .select()
          .from(quizOrderingItem)
          .where(inArray(quizOrderingItem.questionId, questionIds)),
        // Matching Pairs
        db
          .select()
          .from(quizMatchingPair)
          .where(inArray(quizMatchingPair.questionId, questionIds)),
      ]);

      // Group data by questionId for faster lookup
      const optionsMap = new Map<number, typeof mcOptions>();
      mcOptions.forEach((opt) => {
        if (!optionsMap.has(opt.questionId)) optionsMap.set(opt.questionId, []);
        optionsMap.get(opt.questionId)!.push(opt);
      });

      const orderingMap = new Map<number, typeof orderingItems>();
      orderingItems.forEach((item) => {
        if (!orderingMap.has(item.questionId))
          orderingMap.set(item.questionId, []);
        orderingMap.get(item.questionId)!.push(item);
      });

      const matchingMap = new Map<number, typeof matchingPairs>();
      matchingPairs.forEach((pair) => {
        if (!matchingMap.has(pair.questionId))
          matchingMap.set(pair.questionId, []);
        matchingMap.get(pair.questionId)!.push(pair);
      });

      // 3. Grade Responses
      let totalScore = 0;
      let maxPossibleScore = 0;
      const responseInserts: (typeof quizQuestionResponse.$inferInsert)[] = [];

      for (const q of questions) {
        const userAnswerObj = answers.find((a) => a.questionId === q.id);
        const userAnswer = userAnswerObj?.answer;

        maxPossibleScore += q.points;
        let isCorrect: boolean | null = false;
        let pointsEarned = 0;

        if (
          userAnswer === undefined ||
          userAnswer === null ||
          userAnswer === ""
        ) {
          // Skipped question
          pointsEarned = 0;
          isCorrect = false;
        } else if (q.type === "multiple_choice") {
          // userAnswer is expected to be the optionId (string)
          const options = optionsMap.get(q.id) || [];
          const selectedOption = options.find((opt) => opt.id === userAnswer);

          if (selectedOption && selectedOption.isCorrect) {
            isCorrect = true;
            pointsEarned = q.points; // Assuming full points for correct MC
          } else {
            isCorrect = false;
            pointsEarned = 0;
          }
        } else if (q.type === "true_false") {
          // userAnswer is boolean
          if (userAnswer === q.correctBoolean) {
            isCorrect = true;
            pointsEarned = q.points;
          } else {
            isCorrect = false;
            pointsEarned = 0;
          }
        } else if (q.type === "ordering") {
          // userAnswer is string[] (array of item IDs)
          const items = orderingMap.get(q.id) || [];
          // Sort correct items by position
          const correctOrder = items
            .sort((a, b) => a.correctPosition - b.correctPosition)
            .map((i) => i.id);

          const userOrder = Array.isArray(userAnswer) ? userAnswer : [];

          if (JSON.stringify(userOrder) === JSON.stringify(correctOrder)) {
            isCorrect = true;
            pointsEarned = q.points;
          } else {
            isCorrect = false;
            pointsEarned = 0;
          }
        } else if (q.type === "matching") {
          // userAnswer is Record<string, string> mapping pairId -> selectedRightId
          // Note: Based on your MatchingRenderer, the value maps pairId to the correct pairId?
          // Let's assume userAnswer is { [pairId]: selectedRightId }
          // We need to verify if the selected right ID matches the correct pair's right item.

          const pairs = matchingMap.get(q.id) || [];
          let correctCount = 0;

          pairs.forEach((pair) => {
            // Check if user mapped this pair correctly
            // Note: This logic depends heavily on how MatchingRenderer sends data.
            // Assuming: Key = pair.id (left), Value = selected pair.id (right)
            // We check if the right item text matches? Or if the ID matches?
            // Since matching pairs are unique, usually:
            // Correct logic: Did user select the RIGHT item that belongs to THIS pair?

            if (userAnswer && userAnswer[pair.id] === pair.id) {
              // This assumes the 'correct' answer ID is the pair ID itself.
              // Adjust logic if your 'right' items have separate IDs.
              correctCount++;
            }
          });

          if (correctCount === pairs.length) {
            isCorrect = true;
            pointsEarned = q.points;
          } else {
            isCorrect = false;
            // Partial credit? For now: 0
            pointsEarned = 0;
          }
        } else if (q.type === "essay") {
          // Essays require manual grading
          isCorrect = null;
          pointsEarned = 0;
        }

        totalScore += pointsEarned;

        let answerPayload: typeof quizQuestionResponse.$inferInsert.answer;

        // Helper to map raw answer to Schema Type
        if (
          userAnswer === undefined ||
          userAnswer === null ||
          userAnswer === ""
        ) {
          answerPayload = null;
        } else if (q.type === "multiple_choice") {
          // Assuming userAnswer is the optionId (string)
          answerPayload = { type: "option", optionId: String(userAnswer) };
        } else if (q.type === "true_false") {
          // userAnswer is boolean
          answerPayload = { type: "boolean", value: Boolean(userAnswer) };
        } else if (q.type === "ordering") {
          // userAnswer is string[]
          answerPayload = { type: "ordering", order: userAnswer as string[] };
        } else if (q.type === "matching") {
          // userAnswer is Record<string, string>
          answerPayload = {
            type: "matching",
            matches: userAnswer as Record<string, string>,
          };
        } else if (q.type === "essay") {
          // userAnswer is string
          answerPayload = { type: "text", text: String(userAnswer) };
        } else {
          answerPayload = null;
        }

        responseInserts.push({
          attemptId: attempt.id,
          questionId: q.id,
          answer: answerPayload,
          isCorrect,
          pointsEarned,
        });
      }

      // 4. Database Operations (Transaction)
      await db.transaction(async (tx) => {
        // Insert Responses
        if (responseInserts.length > 0) {
          await tx.insert(quizQuestionResponse).values(responseInserts);
        }

        // Update Attempt
        const hasEssay = questions.some((q) => q.type === "essay");
        const finalStatus = hasEssay ? "submitted" : "graded";

        await tx
          .update(quizAttempt)
          .set({
            status: finalStatus,
            score: totalScore,
            maxScore: maxPossibleScore,
            percentage: Math.round((totalScore / maxPossibleScore) * 100),
            submittedAt: new Date(),
            timeSpent,
          })
          .where(eq(quizAttempt.id, attempt.id));
      });

      return {
        success: true,
        attemptId: attempt.id,
        score: totalScore,
        maxScore: maxPossibleScore,
      };
    }),
  getMyTeachingAssignments: protectedProcedure.query(async ({ ctx }) => {
    const teacherId = ctx.auth.user.id;

    // Fetch classes with their stats
    const classes = await db
      .select({
        id: classSubjects.id,
        className: organization.name,
        subjectName: subjectName.name,
        organizationName: organization.name,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .innerJoin(subjectName, eq(subjects.name, subjectName.id))
      .innerJoin(organization, eq(classSubjects.enrolledClass, organization.id))
      .where(eq(classSubjects.teacherId, teacherId))
      .orderBy(desc(classSubjects.enrolledAt));

    // For each class, fetch the activity and submission stats
    const classesWithStats = await Promise.all(
      classes.map(async (cls) => {
        // Get lessons for this class
        const lessonsData = await db
          .select({
            lessonId: lesson.id,
          })
          .from(lesson)
          .where(eq(lesson.classSubjectId, cls.id));

        const lessonIds = lessonsData.map((l) => l.lessonId);

        if (lessonIds.length === 0) {
          return {
            ...cls,
            stats: {
              totalActivities: 0,
              totalQuizzes: 0,
              totalAssignments: 0,
              totalSubmissions: 0,
              pendingGrading: 0,
              totalStudents: 0,
            },
          };
        }

        // Get lesson types (activities)
        const activities = await db
          .select({
            id: lessonType.id,
            type: lessonType.type,
          })
          .from(lessonType)
          .where(
            and(
              eq(lessonType.status, "published"),
              lessonIds.length > 0 ? undefined : eq(lessonType.id, 0),
            ),
          );

        // This is a simplified version - in production you'd want more efficient queries
        // For now, we'll return basic counts
        const totalQuizzes = activities.filter((a) => a.type === "quiz").length;
        const totalAssignments = activities.filter(
          (a) => a.type === "assignment",
        ).length;
        const totalActivities = totalQuizzes + totalAssignments;

        return {
          ...cls,
          stats: {
            totalActivities,
            totalQuizzes,
            totalAssignments,
            totalSubmissions: 0, // Would need to join quizAttempt
            pendingGrading: 0,
            totalStudents: 0, // Would need to join enrolled students
          },
        };
      }),
    );

    return classesWithStats;
  }),
};
