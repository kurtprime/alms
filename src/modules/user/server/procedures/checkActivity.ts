import {
  assignmentDocument,
  attemptStatusEnum,
  classSubjects,
  lesson,
  lessonType,
  member,
  organization,
  quiz,
  quizAttempt,
  quizQuestion,
  quizQuestionResponse,
  subjectName,
  subjects,
  user,
} from '@/db/schema';
import { db } from '@/index';
import { AssignmentMimeType } from '@/services/uploadthing/router';
import { adminProcedure, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq, sql, desc, inArray } from 'drizzle-orm';
import z from 'zod';

export const checkActivityAction = {
  getActivityPerClass: protectedProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;

    const result = await db
      .select({
        id: classSubjects.id,
        name: subjectName.name,
        code: subjects.code,
        activities: sql<
          Array<{
            id: number;
            title: string;
            type: 'assignment' | 'quiz';
            totalStudents: number;
            submissions: Array<{
              id: string; // user.id
              studentId: string; // user.id
              studentName: string;
              studentImage: string | null;
              status: (typeof attemptStatusEnum.enumValues)[number];
              score: number | null;
              maxScore: number | null;
              submittedAt: string | null; // ISO string
            }>;
          }>
        >`COALESCE(
          json_agg(
            json_build_object(
              'id', ${lessonType.id},
              'title', ${lessonType.name},
              'type', ${lessonType.type},
              'totalStudents', (
                SELECT COUNT(*)::int
                FROM ${member}
                WHERE ${member.organizationId} = ${classSubjects.enrolledClass}
                  AND ${member.role} = 'student'
              ),
              'submissions', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', ${user.id},
                      'studentId', ${user.id},
                      'studentName', ${user.name},
                      'studentImage', ${user.image},
                      'status', ${quizAttempt.status},
                      'score', ${quizAttempt.score},
                      'maxScore', ${quizAttempt.maxScore},
                      'submittedAt', ${quizAttempt.submittedAt}
                    )
                  )
                  FROM (
                    -- latest attempt per student for this specific quiz (activity)
                    SELECT DISTINCT ON (${quizAttempt.studentId}) ${quizAttempt}.*
                    FROM ${quizAttempt}
                    INNER JOIN ${quiz} ON ${quiz.id} = ${quizAttempt.quizId}
                    WHERE ${quiz.lessonTypeId} = ${lessonType.id}
                    ORDER BY ${quizAttempt.studentId}, ${quizAttempt.submittedAt} DESC
                  ) ${quizAttempt}
                  INNER JOIN ${user} ON ${user.id} = ${quizAttempt.studentId}
                ),
                '[]'::json
              )
            )
            ORDER BY ${lessonType.id}
          ) FILTER (WHERE ${lessonType.id} IS NOT NULL),
          '[]'::json
        )`,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
      .innerJoin(subjectName, eq(subjectName.id, subjects.name))
      .leftJoin(lesson, eq(lesson.classSubjectId, classSubjects.id))
      .leftJoin(
        lessonType,
        and(eq(lessonType.lessonId, lesson.id), sql`${lessonType.type} IN ('quiz', 'assignment')`)
      )
      .where(eq(classSubjects.teacherId, auth.user.id))
      .groupBy(classSubjects.id, subjectName.name, subjects.code);

    return result;
  }),
  getStudentsPerActivity: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { lessonTypeId } = input;

      // 1. Fetch Lesson Info FIRST
      // We need this regardless of whether students exist
      const [lessonInfo] = await db
        .select({
          name: lessonType.name,
          type: lessonType.type,
        })
        .from(lessonType)
        .where(eq(lessonType.id, lessonTypeId));

      if (!lessonInfo) throw new TRPCError({ code: 'NOT_FOUND' });

      // 2. Fetch Students
      const students = await db
        .select({
          studentId: user.id,
          studentName: user.name,
          studentImage: user.image,
        })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .innerJoin(classSubjects, eq(classSubjects.enrolledClass, organization.id))
        .innerJoin(lesson, eq(lesson.classSubjectId, classSubjects.id))
        .innerJoin(lessonType, eq(lessonType.lessonId, lesson.id))
        .where(
          and(
            eq(classSubjects.teacherId, auth.user.id),
            eq(lessonType.id, lessonTypeId),
            eq(member.role, 'student')
          )
        );

      // 3. Early return if no students, BUT keep the object shape
      if (students.length === 0) {
        return {
          lessonInfo,
          students: [],
        };
      }

      const studentIds = students.map((s) => s.studentId);

      // 4. Fetch Attempts
      const attempts = await db
        .select({
          id: quizAttempt.id,
          studentId: quizAttempt.studentId,
          status: quizAttempt.status,
          score: quizAttempt.score,
          maxScore: quizAttempt.maxScore,
          quizMaxScore: quiz.score,
          percentage: quizAttempt.percentage,
          submittedAt: quizAttempt.submittedAt,
          startedAt: quizAttempt.startedAt,
          timeSpent: quizAttempt.timeSpent,
        })
        .from(quizAttempt)
        .innerJoin(quiz, eq(quiz.id, quizAttempt.quizId))
        .where(and(inArray(quizAttempt.studentId, studentIds), eq(quiz.lessonTypeId, lessonTypeId)))
        .orderBy(desc(quizAttempt.submittedAt));

      // 5. Map Attempts
      const attemptMap = new Map<string, (typeof attempts)[0]>();
      for (const att of attempts) {
        if (!attemptMap.has(att.studentId)) {
          attemptMap.set(att.studentId, att);
        }
      }

      // 6. Return consistent shape
      return {
        lessonInfo,
        students: students.map((student) => {
          const attempt = attemptMap.get(student.studentId);
          return {
            ...student,
            status: attempt?.status ?? null,
            score: attempt?.score ?? null,
            maxScore: (attempt?.maxScore ?? attempt?.quizMaxScore) || null,
            percentage: attempt?.percentage ?? null,
            submittedAt: attempt?.submittedAt ?? null,
            startedAt: attempt?.startedAt ?? null,
            timeSpent: attempt?.timeSpent ?? null,
            attemptId: attempt?.id ?? null,
          };
        }),
      };
    }),
  updateScoreOfQuizResponse: adminProcedure
    .input(
      z.object({
        score: z.number(),
        maxScore: z.number(),
        questionId: z.number(),
        attemptId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { score, maxScore, questionId, attemptId } = input;

      if (score > maxScore) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Score cannot exceed max score for this question.',
        });
      }

      await db.transaction(async (tx) => {
        // 1. Update the specific question response
        await tx
          .update(quizQuestionResponse)
          .set({
            pointsEarned: score,
            gradedAt: new Date(),
          })
          .where(
            and(
              eq(quizQuestionResponse.questionId, questionId),
              eq(quizQuestionResponse.attemptId, attemptId)
            )
          );

        // 2. Fetch all responses for this attempt to recalculate totals
        // We join with quizQuestion to get the max points for every question
        const allResponses = await tx
          .select({
            pointsEarned: quizQuestionResponse.pointsEarned,
            questionPoints: quizQuestion.points,
          })
          .from(quizQuestionResponse)
          .innerJoin(quizQuestion, eq(quizQuestionResponse.questionId, quizQuestion.id))
          .where(eq(quizQuestionResponse.attemptId, attemptId));

        // 3. Calculate Totals
        const totalScore = allResponses.reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0);

        const totalMaxScore = allResponses.reduce((sum, r) => sum + (r.questionPoints ?? 0), 0);

        const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

        // 4. Update the Quiz Attempt
        await tx
          .update(quizAttempt)
          .set({
            score: totalScore,
            maxScore: totalMaxScore,
            percentage: percentage,
            // Optional: If all questions are graded, update status
            // status: "graded"
          })
          .where(eq(quizAttempt.id, attemptId));
      });
    }),
  updateQuizAttempt: adminProcedure
    .input(
      z.object({
        attemptId: z.number(),
        score: z.number().min(0),
        maxScore: z.number().min(1).optional(), // Optional: useful if max score changes or isn't set
        feedback: z.string().optional(), // Optional general feedback
      })
    )
    .mutation(async ({ input }) => {
      const { attemptId, score, maxScore, feedback } = input;

      // 1. Fetch the existing attempt to validate context
      const [existingAttempt] = await db
        .select()
        .from(quizAttempt)
        .where(eq(quizAttempt.id, attemptId));

      if (!existingAttempt) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attempt not found' });
      }

      // 2. Determine the Max Score
      // Use provided maxScore, or fallback to the existing attempt's maxScore
      const finalMaxScore = maxScore ?? existingAttempt.maxScore ?? 100;

      if (score > finalMaxScore) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Score cannot be greater than max score.',
        });
      }

      // 3. Calculate Percentage & Passed status
      const percentage = Math.round((score / finalMaxScore) * 100);

      // Simple passing logic: > 50% (adjust as needed for your business logic)
      const passed = percentage >= 50;

      // 4. Update the Attempt
      await db
        .update(quizAttempt)
        .set({
          score: score,
          maxScore: finalMaxScore,
          percentage: percentage,
          passed: passed,
          status: 'graded', // Mark as graded
          // Note: You might want a 'gradedAt' timestamp column on the attempt table
          // if you add it: gradedAt: new Date()
        })
        .where(eq(quizAttempt.id, attemptId));

      // Optional: Handle Feedback
      // Since 'teacherFeedback' is on quizQuestionResponse,
      // general feedback for an Assignment usually needs a specific column or
      // a dummy response row.
      // For now, we just update the score.

      return { success: true, score, percentage };
    }),
  getStudentAssignmentFiles: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        studentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { lessonTypeId, studentId } = input;

      // STEP 1: Find the Quiz ID linked to this LessonType
      // Logic: lessonType (Input) -> quiz
      const [quizRecord] = await db
        .select({ id: quiz.id })
        .from(quiz)
        .where(eq(quiz.lessonTypeId, lessonTypeId))
        .limit(1);

      // If no quiz exists for this lesson type, return empty
      if (!quizRecord) {
        return [];
      }

      // STEP 2: Find the latest Quiz Attempt by the student
      // Logic: quiz.id + studentId -> quizAttempt
      const [latestAttempt] = await db
        .select({ id: quizAttempt.id })
        .from(quizAttempt)
        .where(and(eq(quizAttempt.quizId, quizRecord.id), eq(quizAttempt.studentId, studentId)))
        .orderBy(desc(quizAttempt.createdAt)) // Get the most recent
        .limit(1);

      // If no attempt found, student hasn't submitted anything
      if (!latestAttempt) {
        return [];
      }

      // STEP 3: Fetch all Assignment Documents
      // Logic: quizAttempt.id -> assignmentDocument
      const files = await db
        .select()
        .from(assignmentDocument)
        .where(eq(assignmentDocument.quizAttemptId, latestAttempt.id));

      // STEP 4: Return with Type Safety
      return files.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.fileUrl,
        key: file.fileKey,
        size: file.size,
        type: file.fileType as AssignmentMimeType,
        uploadedAt: file.uploadedAt,
      }));
    }),
};
