import {
  attemptStatusEnum,
  classSubjects,
  lesson,
  lessonType,
  member,
  quiz,
  quizAttempt,
  subjectName,
  subjects,
  user,
} from "@/db/schema";
import { db } from "@/index";
import { protectedProcedure } from "@/trpc/init";
import { and, eq, sql } from "drizzle-orm";

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
            type: "assignment" | "quiz";
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
        and(
          eq(lessonType.lessonId, lesson.id),
          sql`${lessonType.type} IN ('quiz', 'assignment')`,
        ),
      )
      .where(eq(classSubjects.teacherId, auth.user.id))
      .groupBy(classSubjects.id, subjectName.name, subjects.code);

    return result;
  }),
};
