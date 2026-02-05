import { classSubjects, lesson, member, organization, user } from "@/db/schema";
import { db } from "@/index";
import { protectedProcedure } from "@/trpc/init";
import { and, eq, exists, getTableColumns, or } from "drizzle-orm";
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
  getAllLessonsInClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { classId } = input;
      const { auth } = ctx;

      const lessons = await db
        .select()
        .from(lesson)
        .where(eq(lesson.classSubjectId, classId));

      return lessons;
    }),
};
