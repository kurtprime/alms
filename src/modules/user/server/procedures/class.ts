import {
  classSubjects,
  lesson,
  lessonDocument,
  lessonType,
  member,
  organization,
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
      const { classId } = input;
      const isTeacher = ctx.auth.user.role === "teacher";

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
            : and(eq(lesson.classSubjectId, classId), isNotNull(lesson.terms)),
        );

      if (lessons.length === 0) return [];

      // 2. Get all lesson type IDs for these lessons
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
        // Return lessons with empty lessonTypes
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

      // 4. Serialize MDX and attach documents to each lesson type
      const lessonTypesWithSerializedMDXAndDocs = await Promise.all(
        allLessonTypes.map(async (item) => {
          const documents = allDocuments.filter(
            (doc) => doc.lessonTypeId === item.id,
          );

          return {
            ...item,
            serializedMarkup: await serializeMDX(item.markup ?? ""),
            documents,
          };
        }),
      );

      // 5. Map lessons with their lesson types (which now include documents)
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
};
