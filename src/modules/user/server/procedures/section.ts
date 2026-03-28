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

    // 1. Fetch Base Class Data - Split by role to avoid duplicate rows
    // Teachers: Get classes they teach (no member join needed)
    // Students: Get classes where they are a member of the organization
    const classes = isTeacher
      ? await db
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
          .innerJoin(user, eq(classSubjects.teacherId, user.id))
          .where(eq(classSubjects.teacherId, userId))
      : await db
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
          .innerJoin(
            member,
            and(eq(member.organizationId, organization.id), eq(member.userId, userId))
          )
          .innerJoin(user, eq(classSubjects.teacherId, user.id));

    if (classes.length === 0) return [];

    // Deduplicate by class ID (safety measure)
    const uniqueClasses = Array.from(new Map(classes.map((c) => [c.id, c])).values());
    const classIds = uniqueClasses.map((c) => c.id);

    // 2. Fetch LessonTypes (shared between both roles)
    const lessonTypes =
      classIds.length > 0
        ? await db
            .select({ id: lessonType.id, classSubjectId: lesson.classSubjectId })
            .from(lessonType)
            .innerJoin(lesson, eq(lesson.id, lessonType.lessonId))
            .where(inArray(lesson.classSubjectId, classIds))
        : [];

    // Early exit if no lesson types
    if (lessonTypes.length === 0) {
      if (isTeacher) {
        const studentCounts = await db
          .select({ classId: member.organizationId, count: count() })
          .from(member)
          .where(
            and(
              inArray(
                member.organizationId,
                uniqueClasses.map((c) => c.organizationId)
              ),
              eq(member.role, 'student')
            )
          )
          .groupBy(member.organizationId);

        const studentCountMap = new Map(studentCounts.map((s) => [s.classId, s.count]));

        return uniqueClasses.map((c) => ({
          ...c,
          role: 'teacher' as const,
          studentCount: studentCountMap.get(c.organizationId) ?? 0,
          toCheckCount: 0,
        }));
      }

      return uniqueClasses.map((c) => ({
        ...c,
        role: 'student' as const,
        progress: { total: 0, done: 0 },
      }));
    }

    const lessonTypeIds = lessonTypes.map((lt) => lt.id);

    // Map: LessonTypeID -> ClassID
    const lessonTypeToClassMap = new Map(lessonTypes.map((lt) => [lt.id, lt.classSubjectId]));

    // 3. ROLE-BASED AGGREGATION
    if (isTeacher) {
      // --- TEACHER LOGIC ---

      const quizzes = await db
        .select({ id: quiz.id, lessonTypeId: quiz.lessonTypeId })
        .from(quiz)
        .where(inArray(quiz.lessonTypeId, lessonTypeIds));

      // Build QuizID -> ClassID map, handling nullable lessonTypeId
      const quizToClassMap = new Map<number, string>();
      for (const q of quizzes) {
        if (q.lessonTypeId !== null) {
          const classId = lessonTypeToClassMap.get(q.lessonTypeId);
          if (classId) {
            quizToClassMap.set(q.id, classId);
          }
        }
      }

      const quizIds = Array.from(quizToClassMap.keys());

      // Early return if no valid quizzes
      if (quizIds.length === 0) {
        const studentCounts = await db
          .select({ classId: member.organizationId, count: count() })
          .from(member)
          .where(
            and(
              inArray(
                member.organizationId,
                uniqueClasses.map((c) => c.organizationId)
              ),
              eq(member.role, 'student')
            )
          )
          .groupBy(member.organizationId);

        const studentCountMap = new Map(studentCounts.map((s) => [s.classId, s.count]));

        return uniqueClasses.map((c) => ({
          ...c,
          role: 'teacher' as const,
          studentCount: studentCountMap.get(c.organizationId) ?? 0,
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
      for (const att of allAttempts) {
        const key = `${att.studentId}-${att.quizId}`;
        if (!latestAttemptsMap.has(key)) {
          latestAttemptsMap.set(key, att);
        }
      }

      // Aggregate Counts
      const countsMap = new Map<string, { toCheck: number }>();
      for (const id of classIds) {
        countsMap.set(id, { toCheck: 0 });
      }

      for (const att of latestAttemptsMap.values()) {
        if (att.status === 'submitted' || att.status === 'expired') {
          const classId = quizToClassMap.get(att.quizId);
          if (classId) {
            const entry = countsMap.get(classId);
            if (entry) entry.toCheck++;
          }
        }
      }

      // Student Counts
      const studentCounts = await db
        .select({ classId: member.organizationId, count: count() })
        .from(member)
        .where(
          and(
            inArray(
              member.organizationId,
              uniqueClasses.map((c) => c.organizationId)
            ),
            eq(member.role, 'student')
          )
        )
        .groupBy(member.organizationId);

      const studentCountMap = new Map(studentCounts.map((s) => [s.classId, s.count]));

      return uniqueClasses.map((c) => ({
        ...c,
        role: 'teacher' as const,
        studentCount: studentCountMap.get(c.organizationId) ?? 0,
        toCheckCount: countsMap.get(c.id)?.toCheck ?? 0,
      }));
    } else {
      // --- STUDENT LOGIC ---

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

      // Build QuizID -> ClassID map, handling nullable lessonTypeId
      const quizToClassMap = new Map<number, string>();
      for (const q of quizzes) {
        if (q.lessonTypeId !== null) {
          const classId = lessonTypeToClassMap.get(q.lessonTypeId);
          if (classId) {
            quizToClassMap.set(q.id, classId);
          }
        }
      }

      const quizIds = Array.from(quizToClassMap.keys());

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
      for (const att of attemptsRaw) {
        if (!latestQuizAttempts.has(att.quizId)) {
          latestQuizAttempts.set(att.quizId, att);
        }
      }

      // 3. Aggregate per Class
      const progressMap = new Map<string, { total: number; done: number }>();
      for (const id of classIds) {
        progressMap.set(id, { total: 0, done: 0 });
      }

      // Count totals (All LessonTypes)
      for (const lt of lessonTypes) {
        const entry = progressMap.get(lt.classSubjectId);
        if (entry) entry.total++;
      }

      // Count done (Handouts)
      for (const item of doneItems) {
        const classId = lessonTypeToClassMap.get(item.lessonTypeId);
        if (classId) {
          const entry = progressMap.get(classId);
          if (entry) entry.done++;
        }
      }

      // Count done (Quizzes - Based on Latest Attempt)
      for (const att of latestQuizAttempts.values()) {
        // If the LATEST attempt is NOT in_progress, it counts as done (submitted/graded/expired)
        if (att.status !== 'in_progress') {
          const classId = quizToClassMap.get(att.quizId);
          if (classId) {
            const entry = progressMap.get(classId);
            if (entry) entry.done++;
          }
        }
      }

      return uniqueClasses.map((c) => ({
        ...c,
        role: 'student' as const,
        progress: progressMap.get(c.id) ?? { total: 0, done: 0 },
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
