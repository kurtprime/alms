import {
  classSubjects,
  lesson,
  lessonType,
  member,
  organization,
  user,
} from "@/db/schema";
import { db } from "@/index";
import { waitFor } from "@/services/waitFor";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { id } from "date-fns/locale";
import {
  and,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNotNull,
  not,
  or,
  sql,
} from "drizzle-orm";
import z from "zod";

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
    .input(z.object({ classId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.auth.user.role === "teacher") {
        const { classId } = input;
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
          .where(eq(lesson.classSubjectId, classId));

        // 2. Get all lesson types for these lessons
        const lessonIds = lessons.map((l) => l.id);

        const allLessonTypes = await db
          .select()
          .from(lessonType)
          .where(inArray(lessonType.lessonId, lessonIds)); // Assuming lessonType has lessonId FK

        // 3. Map them together
        const lessonsWithTypes = lessons.map((l) => ({
          ...l,
          lessonTypes: allLessonTypes.filter((lt) => lt.lessonId === l.id),
        }));

        return lessonsWithTypes;
      } else {
        const { classId } = input;
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
            and(eq(lesson.classSubjectId, classId), isNotNull(lesson.terms)),
          );

        // 2. Get all lesson types for these lessons
        const lessonIds = lessons.map((l) => l.id);

        const allLessonTypes = await db
          .select()
          .from(lessonType)
          .where(
            and(
              inArray(lessonType.lessonId, lessonIds),
              eq(lessonType.status, "published"),
            ),
          ); // Assuming lessonType has lessonId FK

        // 3. Map them together
        const lessonsWithTypes = lessons.map((l) => ({
          ...l,
          lessonTypes: allLessonTypes.filter((lt) => lt.lessonId === l.id),
        }));

        return lessonsWithTypes;
      }
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
};
