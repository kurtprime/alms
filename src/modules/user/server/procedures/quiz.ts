import {
  classSubjects,
  lesson,
  lessonType,
  organization,
  quiz,
  quizAttempt,
  quizQuestion,
  subjectName,
  subjects,
} from '@/db/schema';
import { db } from '@/index';
import { protectedProcedure } from '@/trpc/init';
import { and, count, eq, inArray, isNotNull, sql } from 'drizzle-orm';

export const quizActions = {
  getTeacherQuizzes: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    const teacherClasses = await db
      .select({ id: classSubjects.id })
      .from(classSubjects)
      .where(eq(classSubjects.teacherId, userId));

    if (teacherClasses.length === 0) return [];

    const classIds = teacherClasses.map((c) => c.id);

    const lessonsData = await db
      .select({ id: lesson.id, classSubjectId: lesson.classSubjectId })
      .from(lesson)
      .where(inArray(lesson.classSubjectId, classIds));

    if (lessonsData.length === 0) return [];

    const lessonIds = lessonsData.map((l) => l.id);
    const lessonToClass = new Map(lessonsData.map((l) => [l.id, l.classSubjectId]));

    const lessonTypesData = await db
      .select({
        id: lessonType.id,
        lessonId: lessonType.lessonId,
        status: lessonType.status,
        name: lessonType.name,
      })
      .from(lessonType)
      .where(
        and(
          inArray(lessonType.lessonId, lessonIds),
          eq(lessonType.type, 'quiz'),
          sql`${lessonType.status} != 'archived'`
        )
      );

    if (lessonTypesData.length === 0) return [];

    const lessonTypeIds = lessonTypesData.map((lt) => lt.id);

    const quizzesData = await db
      .select({
        id: quiz.id,
        lessonTypeId: quiz.lessonTypeId,
        name: quiz.name,
        description: quiz.description,
        status: quiz.status,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        startDate: quiz.startDate,
        endDate: quiz.endDate,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      })
      .from(quiz)
      .where(inArray(quiz.lessonTypeId, lessonTypeIds));

    if (quizzesData.length === 0) return [];

    const quizIds = quizzesData.map((q) => q.id);

    const questionCounts = await db
      .select({
        quizId: quizQuestion.quizId,
        count: count(),
      })
      .from(quizQuestion)
      .where(inArray(quizQuestion.quizId, quizIds))
      .groupBy(quizQuestion.quizId);

    const questionCountMap = new Map(questionCounts.map((q) => [q.quizId, q.count]));

    const attemptStats = await db
      .select({
        quizId: quizAttempt.quizId,
        totalSubmissions: count(),
        pendingGrading: sql<number>`count(*) filter (where ${quizAttempt.status} in ('submitted', 'expired'))`,
      })
      .from(quizAttempt)
      .where(
        and(
          inArray(quizAttempt.quizId, quizIds),
          inArray(quizAttempt.status, ['submitted', 'expired', 'graded'])
        )
      )
      .groupBy(quizAttempt.quizId);

    const attemptStatsMap = new Map(
      attemptStats.map((a) => [
        a.quizId,
        { totalSubmissions: a.totalSubmissions, pendingGrading: a.pendingGrading },
      ])
    );

    const uniqueClassIds = [...new Set(lessonsData.map((l) => l.classSubjectId))];
    const classInfo = await db
      .select({
        id: classSubjects.id,
        className: organization.name,
        subjectName: subjectName.name,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
      .innerJoin(subjectName, eq(subjectName.id, subjects.name))
      .innerJoin(organization, eq(organization.id, classSubjects.enrolledClass))
      .where(inArray(classSubjects.id, uniqueClassIds));

    const classInfoMap = new Map(classInfo.map((c) => [c.id, c]));

    const lessonTypeMap = new Map(lessonTypesData.map((lt) => [lt.id, lt]));

    return quizzesData.map((q) => {
      const lt = lessonTypeMap.get(q.lessonTypeId!);
      const classSubjectId = lt ? lessonToClass.get(lt.lessonId) : null;
      const classInfoItem = classSubjectId ? classInfoMap.get(classSubjectId) : null;
      const stats = attemptStatsMap.get(q.id) ?? { totalSubmissions: 0, pendingGrading: 0 };

      return {
        quizId: q.id,
        quizName: q.name,
        quizDescription: q.description,
        quizStatus: q.status ?? 'draft',
        lessonTypeStatus: lt?.status ?? 'draft',
        lessonTypeName: lt?.name ?? null,
        classSubjectId: classSubjectId ?? '',
        className: classInfoItem?.className ?? 'Unknown Class',
        subjectName: classInfoItem?.subjectName ?? 'Unknown Subject',
        questionCount: questionCountMap.get(q.id) ?? 0,
        totalSubmissions: stats.totalSubmissions,
        pendingGrading: stats.pendingGrading,
        timeLimit: q.timeLimit,
        maxAttempts: q.maxAttempts,
        startDate: q.startDate,
        endDate: q.endDate,
        lessonTypeId: q.lessonTypeId ?? 0,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      };
    });
  }),

  getTeacherQuizStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    const teacherClasses = await db
      .select({ id: classSubjects.id })
      .from(classSubjects)
      .where(eq(classSubjects.teacherId, userId));

    if (teacherClasses.length === 0) {
      return { totalQuizzes: 0, totalQuestions: 0, totalSubmissions: 0, pendingGrading: 0 };
    }

    const classIds = teacherClasses.map((c) => c.id);

    const lessonsData = await db
      .select({ id: lesson.id })
      .from(lesson)
      .where(inArray(lesson.classSubjectId, classIds));

    if (lessonsData.length === 0) {
      return { totalQuizzes: 0, totalQuestions: 0, totalSubmissions: 0, pendingGrading: 0 };
    }

    const lessonIds = lessonsData.map((l) => l.id);

    const lessonTypesData = await db
      .select({ id: lessonType.id })
      .from(lessonType)
      .where(
        and(
          inArray(lessonType.lessonId, lessonIds),
          eq(lessonType.type, 'quiz'),
          sql`${lessonType.status} != 'archived'`
        )
      );

    if (lessonTypesData.length === 0) {
      return { totalQuizzes: 0, totalQuestions: 0, totalSubmissions: 0, pendingGrading: 0 };
    }

    const lessonTypeIds = lessonTypesData.map((lt) => lt.id);

    const [quizCountResult] = await db
      .select({ count: count() })
      .from(quiz)
      .where(and(isNotNull(quiz.lessonTypeId), inArray(quiz.lessonTypeId, lessonTypeIds)));

    const quizzesData = await db
      .select({ id: quiz.id })
      .from(quiz)
      .where(inArray(quiz.lessonTypeId, lessonTypeIds));

    const quizIds = quizzesData.map((q) => q.id);

    let totalQuestions = 0;
    if (quizIds.length > 0) {
      const [questionCountResult] = await db
        .select({ count: count() })
        .from(quizQuestion)
        .where(inArray(quizQuestion.quizId, quizIds));
      totalQuestions = questionCountResult?.count ?? 0;
    }

    let totalSubmissions = 0;
    let pendingGrading = 0;
    if (quizIds.length > 0) {
      const [attemptResult] = await db
        .select({
          totalSubmissions: count(),
          pendingGrading: sql<number>`count(*) filter (where ${quizAttempt.status} in ('submitted', 'expired'))`,
        })
        .from(quizAttempt)
        .where(
          and(
            inArray(quizAttempt.quizId, quizIds),
            inArray(quizAttempt.status, ['submitted', 'expired', 'graded'])
          )
        );
      totalSubmissions = attemptResult?.totalSubmissions ?? 0;
      pendingGrading = attemptResult?.pendingGrading ?? 0;
    }

    return {
      totalQuizzes: quizCountResult?.count ?? 0,
      totalQuestions,
      totalSubmissions,
      pendingGrading,
    };
  }),
};
