import { adminProcedure } from "@/trpc/init";
import {
  createSubjectSchema,
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
import { and, eq, sql } from "drizzle-orm";
import { users } from "./users";

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
        subjectCount: sql<number>`cast(count(distinct ${subjects.id}) as int)`,
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
  getAllSubjectsPerClass: adminProcedure
    .input(getAllSubjectsForClassSchema)
    .query(async ({ input }) => {
      const { subjectId } = input;

      return await db
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
        })
        .from(subjectName)
        .innerJoin(subjects, eq(subjects.name, subjectName.id))
        .innerJoin(classSubjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(
          organization,
          eq(organization.id, classSubjects.enrolledClass)
        )
        .innerJoin(user, eq(classSubjects.teacherId, user.id))
        .where(eq(subjectName.id, subjectId));
    }),
};
