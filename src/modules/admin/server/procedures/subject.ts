import { adminProcedure } from "@/trpc/init";
import {
  createSubjectSchema,
  getAllSubjectInfoSchema,
  getAllSubjectsForClassSchema,
  getSubjectSchema,
  newSubjectNameSchema,
} from "../adminSchema";
import { db } from "@/index";
import {
  classSubjects,
  member,
  organization,
  subjectName,
  subjects,
  user,
} from "@/db/schema";
import { and, count, eq, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const subjectActions = {
  createSubjectName: adminProcedure
    .input(newSubjectNameSchema)
    .mutation(async ({ input }) => {
      const { name, description } = input;

      await db.insert(subjectName).values({
        name,
        description,
      });
    }),
  getAllSubjectNames: adminProcedure.query(async () => {
    return await db
      .select({ id: subjectName.id, name: subjectName.name })
      .from(subjectName)
      .orderBy(subjectName.name);
  }),
  createSubjectClass: adminProcedure
    .input(createSubjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, code, teacherId, classId, description, status } = input;

      await db.transaction(async (tx) => {
        const [newSubject] = await tx
          .insert(subjects)
          .values({
            name: name,
            code: code,
            description: description,
            status: status,
          })
          .returning({ id: subjects.id });

        await tx.insert(classSubjects).values({
          enrolledClass: classId,
          subjectId: newSubject.id,
          teacherId: teacherId,
          assignedBy: ctx.auth.user.id,
        });
      });
    }),
  getAllAdminSubject: adminProcedure.input(getSubjectSchema).query(async () => {
    const result = await db
      .select({
        id: subjectName.id,
        subjectName: subjectName.name,
        subjectCount: count(
          sql`distinct case when ${subjects.status} != 'archived' then ${subjects.id} end`
        ),
        teacherCount:
          sql<number>`cast(count(distinct ${classSubjects.teacherId}) as int)`.mapWith(
            Number
          ), // Count distinct teachers
      })
      .from(subjectName)
      .leftJoin(subjects, eq(subjectName.id, subjects.name))
      .leftJoin(classSubjects, eq(subjects.id, classSubjects.subjectId))
      .groupBy(subjectName.id, subjectName.name);

    if (!result) {
      throw new Error("No subjects found");
    }
    return result;
  }),
  getAllSubjectIdPerClass: adminProcedure
    .input(getAllSubjectsForClassSchema)
    .query(async ({ input }) => {
      const { subjectId } = input;

      return await db
        .select({
          classSubjectId: classSubjects.id,
        })
        .from(subjectName)
        .innerJoin(
          subjects,
          and(
            eq(subjects.name, subjectName.id),
            or(eq(subjects.status, "draft"), eq(subjects.status, "published"))
          )
        )
        .innerJoin(classSubjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(
          organization,
          eq(organization.id, classSubjects.enrolledClass)
        )
        .innerJoin(user, eq(classSubjects.teacherId, user.id))
        .where(
          and(
            or(eq(subjects.status, "draft"), eq(subjects.status, "published")),
            eq(subjectName.id, subjectId)
          )
        );
    }),
  getAllSubjectInfo: adminProcedure
    .input(getAllSubjectInfoSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;

      try {
        // Fix: Remove the duplicate subjectName join and fix the logic
        const result = await db
          .select({
            id: classSubjects.id,
            enrolledClass: organization,
            subjectCode: subjects.code,
            teacher: user.name,
            status: subjects.status,
            studentCount: db.$count(
              member,
              and(
                eq(member.organizationId, classSubjects.enrolledClass),
                eq(member.role, "student")
              )
            ),
            subjectName: subjectName.name,
          })
          .from(classSubjects)
          .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
          .innerJoin(subjectName, eq(subjects.name, subjectName.id)) // Only join once
          .innerJoin(
            organization,
            eq(organization.id, classSubjects.enrolledClass)
          )
          .innerJoin(user, eq(classSubjects.teacherId, user.id))
          .where(
            and(
              or(
                eq(subjects.status, "draft"),
                eq(subjects.status, "published")
              ),
              eq(classSubjects.id, id)
            )
          )
          .limit(1); // Add limit to ensure single result

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class subject not found",
          });
        }

        return result[0];
      } catch (error) {
        console.error("Error in getAllSubjectInfo:", error);
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subject information",
        });
      }
    }),
};
