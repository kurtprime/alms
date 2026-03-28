import {
  classSubjects,
  lesson,
  lessonType,
  markAsDone,
  member,
  organization,
  quiz,
  quizAttempt,
  subjectName,
  subjects,
  user,
  userRoleEnum,
} from '@/db/schema';
import { db } from '@/index';
import { getManySectionsSchema } from '@/modules/admin/server/adminSchema';
import { adminProcedure, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, not, or, inArray, count } from 'drizzle-orm';
import z from 'zod';

type SectionInfo =
  | {
      id: string;
      subjectName: string;
      subjectCode: string;
      enrolledClassName: string;
      teacherName: string;
      teacherId: string;
      role: 'teacher';
      studentCount: number;
      toCheckCount: number;
    }
  | {
      id: string;
      subjectName: string;
      subjectCode: string;
      enrolledClassName: string;
      teacherName: string;
      teacherId: string;
      role: 'student';
      progress: { total: number; done: number };
    };

export const sectionActions = {
  getManySections: protectedProcedure.input(getManySectionsSchema).query(async ({ input, ctx }) => {
    const { auth } = ctx;
    if (auth.user.role !== 'teacher') {
      throw new Error('Only teachers can access sections');
    }
    const { name, slug } = input;
    const data = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        createdAt: organization.createdAt,
        // Count students for each organization
        studentCount: db.$count(
          member,
          and(
            eq(member.organizationId, organization.id), // Correlate with outer query
            eq(member.role, 'student') // Filter by role
          )
        ),
      })
      .from(organization)
      .where(
        or(
          name ? ilike(organization.name, `%${name}%`) : undefined,
          slug ? ilike(organization.slug, `%${slug}%`) : undefined
        )
      )
      .orderBy(desc(organization.createdAt));

    return data;
  }),
  getTheCurrentJoinedSections: protectedProcedure
    .input(getManySectionsSchema)
    .query(async ({ input, ctx }) => {
      const { name, slug } = input;

      const data = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          createdAt: organization.createdAt,
          // Count students for each organization
          studentCount: db.$count(
            member,
            and(
              eq(member.organizationId, organization.id), // Correlate with outer query
              eq(member.role, 'student') // Filter by role
            )
          ),
        })

        .from(organization)
        .innerJoin(classSubjects, eq(classSubjects.enrolledClass, organization.id))
        .where(
          and(
            or(
              name ? ilike(organization.name, `%${name}%`) : undefined,
              slug ? ilike(organization.slug, `%${slug}%`) : undefined
            ),
            eq(classSubjects.teacherId, ctx.auth.user.id)
          )
        )
        .groupBy(
          organization.id,
          organization.name,
          organization.slug,
          organization.logo,
          organization.createdAt
        )
        .orderBy(desc(organization.createdAt));

      return data;
    }),
  getCurrentSectionInfo: protectedProcedure.query(async ({ ctx }) => {
    const { id: userId } = ctx.auth.user;
    const isTeacher = ctx.auth.user.role === 'teacher';

    // 1. Fetch Base Class Data
    const classes = await db
      .select({
        id: classSubjects.id,
        organizationId: organization.id,
        subjectName: subjectName.name,
        subjectCode: subjects.code,
        enrolledClassName: organization.name,
        teacherName: user.name,
        teacherId: classSubjects.teacherId,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .innerJoin(subjectName, eq(subjects.name, subjectName.id))
      .innerJoin(organization, eq(organization.id, classSubjects.enrolledClass))
      .innerJoin(member, eq(member.organizationId, organization.id))
      .innerJoin(user, eq(classSubjects.teacherId, user.id))
      .where(or(eq(member.userId, userId), eq(classSubjects.teacherId, userId)));

    if (classes.length === 0) return [];

    const classIds = classes.map((c) => c.id);

    // 2. ROLE-BASED AGGREGATION
    if (isTeacher) {
      // --- TEACHER LOGIC ---

      const lessonTypes = await db
        .select({ id: lessonType.id, classSubjectId: lesson.classSubjectId })
        .from(lessonType)
        .innerJoin(lesson, eq(lesson.id, lessonType.lessonId))
        .where(inArray(lesson.classSubjectId, classIds));

      const lessonTypeIds = lessonTypes.map((lt) => lt.id);

      // Map: LessonTypeID -> ClassID
      const lessonTypeToClassMap = new Map(lessonTypes.map((lt) => [lt.id, lt.classSubjectId]));

      const quizzes = await db
        .select({ id: quiz.id, lessonTypeId: quiz.lessonTypeId })
        .from(quiz)
        .where(inArray(quiz.lessonTypeId, lessonTypeIds));

      const quizIds = quizzes.map((q) => q.id);

      // Map: QuizID -> ClassID
      const quizToClassMap = new Map(
        quizzes.map((q) => [q.id, lessonTypeToClassMap.get(q.lessonTypeId)])
      );

      if (quizIds.length === 0) {
        // Return empty state if no quizzes
        const studentCounts = await db
          .select({ classId: member.organizationId, count: count() })
          .from(member)
          .where(
            and(
              inArray(
                member.organizationId,
                classes.map((c) => c.organizationId)
              ),
              eq(member.role, 'student')
            )
          )
          .groupBy(member.organizationId);

        const studentCountMap = new Map(studentCounts.map((s) => [s.classId, s.count]));

        return classes.map((c) => ({
          ...c,
          role: 'teacher',
          studentCount: studentCountMap.get(c.organizationId) || 0,
          toCheckCount: 0,
        }));
      }

      // Fetch all relevant attempts (Newest First)
      const allAttempts = await db
        .select({
          quizId: quizAttempt.quizId,
          studentId: quizAttempt.studentId,
          status: quizAttempt.status,
          createdAt: quizAttempt.createdAt,
        })
        .from(quizAttempt)
        .where(
          and(
            inArray(quizAttempt.quizId, quizIds),
            inArray(quizAttempt.status, ['submitted', 'expired', 'graded'])
          )
        )
        .orderBy(desc(quizAttempt.createdAt));

      // Deduplicate: Keep only LATEST attempt per Student per Quiz
      const latestAttemptsMap = new Map<string, (typeof allAttempts)[0]>();
      allAttempts.forEach((att) => {
        const key = `${att.studentId}-${att.quizId}`;
        if (!latestAttemptsMap.has(key)) {
          latestAttemptsMap.set(key, att);
        }
      });

      // Aggregate Counts
      const countsMap = new Map<string, { toCheck: number }>();
      classIds.forEach((id) => countsMap.set(id, { toCheck: 0 }));

      latestAttemptsMap.forEach((att) => {
        if (att.status === 'submitted' || att.status === 'expired') {
          const classId = quizToClassMap.get(att.quizId);
          if (classId) {
            const entry = countsMap.get(classId);
            if (entry) entry.toCheck++;
          }
        }
      });

      // Student Counts
      const studentCounts = await db
        .select({ classId: member.organizationId, count: count() })
        .from(member)
        .where(
          and(
            inArray(
              member.organizationId,
              classes.map((c) => c.organizationId)
            ),
            eq(member.role, 'student')
          )
        )
        .groupBy(member.organizationId);

      const studentCountMap = new Map(studentCounts.map((s) => [s.classId, s.count]));

      return classes.map((c) => ({
        ...c,
        role: 'teacher',
        studentCount: studentCountMap.get(c.organizationId) || 0,
        toCheckCount: countsMap.get(c.id)?.toCheck || 0,
      }));
    } else {
      // --- STUDENT LOGIC ---

      const lessonTypes = await db
        .select({
          id: lessonType.id,
          classSubjectId: lesson.classSubjectId,
        })
        .from(lessonType)
        .innerJoin(lesson, eq(lesson.id, lessonType.lessonId))
        .where(inArray(lesson.classSubjectId, classIds));

      const lessonTypeIds = lessonTypes.map((lt) => lt.id);

      // Map: LessonTypeID -> ClassID
      const lessonTypeToClassMap = new Map(lessonTypes.map((lt) => [lt.id, lt.classSubjectId]));

      // A. Mark as Done (Handouts)
      const doneItems = await db
        .select({ lessonTypeId: markAsDone.lessonTypeId })
        .from(markAsDone)
        .where(
          and(
            eq(markAsDone.userId, userId),
            inArray(markAsDone.lessonTypeId, lessonTypeIds),
            eq(markAsDone.isDone, true)
          )
        );

      // B. Quizzes
      const quizzes = await db
        .select({ id: quiz.id, lessonTypeId: quiz.lessonTypeId })
        .from(quiz)
        .where(inArray(quiz.lessonTypeId, lessonTypeIds));

      const quizIds = quizzes.map((q) => q.id);

      // Map: QuizID -> ClassID
      const quizToClassMap = new Map(
        quizzes.map((q) => [q.id, lessonTypeToClassMap.get(q.lessonTypeId)])
      );

      // C. Fetch Attempts (Newest First)
      // We fetch 'graded', 'submitted', 'expired'. 'in_progress' does NOT count as done yet.
      const attemptsRaw =
        quizIds.length > 0
          ? await db
              .select({
                quizId: quizAttempt.quizId,
                status: quizAttempt.status,
                createdAt: quizAttempt.createdAt,
              })
              .from(quizAttempt)
              .where(and(eq(quizAttempt.studentId, userId), inArray(quizAttempt.quizId, quizIds)))
              .orderBy(desc(quizAttempt.createdAt))
          : [];

      // D. Deduplicate: Keep only LATEST attempt per Quiz
      const latestQuizAttempts = new Map<number, (typeof attemptsRaw)[number]>();
      attemptsRaw.forEach((att) => {
        if (!latestQuizAttempts.has(att.quizId)) {
          latestQuizAttempts.set(att.quizId, att);
        }
      });

      // 3. Aggregate per Class
      const progressMap = new Map<string, { total: number; done: number }>();
      classIds.forEach((id) => progressMap.set(id, { total: 0, done: 0 }));

      // Count totals (All LessonTypes)
      lessonTypes.forEach((lt) => {
        const entry = progressMap.get(lt.classSubjectId);
        if (entry) entry.total++;
      });

      // Count done (Handouts)
      doneItems.forEach((item) => {
        const classId = lessonTypeToClassMap.get(item.lessonTypeId);
        if (classId) {
          const entry = progressMap.get(classId);
          if (entry) entry.done++;
        }
      });

      // Count done (Quizzes - Based on Latest Attempt)
      latestQuizAttempts.forEach((att) => {
        // If the LATEST attempt is NOT in_progress, it counts as done (submitted/graded/expired)
        if (att.status !== 'in_progress') {
          const classId = quizToClassMap.get(att.quizId);
          if (classId) {
            const entry = progressMap.get(classId);
            if (entry) entry.done++;
          }
        }
      });

      return classes.map((c) => ({
        ...c,
        role: 'student',
        progress: progressMap.get(c.id) || { total: 0, done: 0 },
      }));
    }
  }),
  getQuizDetails: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ input }) => {
      const { quizId } = input;

      const data = await db
        .select({
          id: quiz.id,
          name: quiz.name,
          lessonTypeId: quiz.lessonTypeId,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
          shuffleQuestions: quiz.shuffleQuestions,
          showScoreAfterSubmission: quiz.showScoreAfterSubmission,
          showCorrectAnswers: quiz.showCorrectAnswers,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          status: quiz.status,
          // You can join with lessonType here if needed to get the name
        })
        .from(quiz)
        .where(eq(quiz.id, quizId))
        .limit(1);

      return data[0];
    }),
  updateQuizSettings: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        data: z.object({
          name: z.string().min(1, 'Quiz name is required'),
          description: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { quizId, data } = input;

      await db
        .update(quiz)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(quiz.id, quizId));

      return { success: true };
    }),
};
