import { adminProcedure } from "@/trpc/init";
import {
  createSubjectSchema,
  getSubjectSchema,
  newSubjectNameSchema,
} from "../adminSchema";
import { db } from "@/index";
import {
  classSubjects,
  organization,
  subjectName,
  subjects,
  user,
} from "@/db/schema";
import { eq } from "drizzle-orm";
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
  getAllSubjects: adminProcedure.input(getSubjectSchema).query(async () => {
    return await db
      .select({
        classId: classSubjects.id,
        className: organization.name,
        slug: organization.slug,
        teacher: user.name,
        subjectName: subjects.name,
      })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .innerJoin(user, eq(classSubjects.teacherId, user.id))
      .innerJoin(organization, eq(classSubjects.enrolledClass, organization.id))
      .innerJoin(subjectName, eq(subjects.name, subjectName.id))
      .innerJoin(user, eq(classSubjects.assignedBy, user.id));
  }),
};
