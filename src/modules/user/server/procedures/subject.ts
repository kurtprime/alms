import { organization, user, member } from "@/db/schema";
import {
  classSubjects,
  subjectName,
  subjects,
} from "@/db/schemas/subject-schema";
import { db } from "@/index";
import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export const subjectActions = {
  getAllSubjectNames: protectedProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;
    if (auth.user.role !== "teacher") {
      throw new Error("Only teachers can access subject names");
    }
    return await db
      .select({ id: subjectName.id, name: subjectName.name })
      .from(subjectName)

      .orderBy(subjectName.name);
  }),
  getCurrentSubjectName: protectedProcedure.query(async ({ ctx }) => {
    const data = await db
      .select({ id: subjectName.id, name: subjectName.name })
      .from(subjectName)
      .innerJoin(subjects, eq(subjects.name, subjectName.id))
      .innerJoin(classSubjects, eq(classSubjects.subjectId, subjects.id))
      .where(eq(classSubjects.teacherId, ctx.auth.user.id))
      .groupBy(subjectName.id, subjectName.name)
      .orderBy(subjectName.name);

    return data;
  }),
  createSubjectClass: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;
      const { name, code, classId, description, status } = input;
      if (auth.user.role !== "teacher") {
        throw new Error("Only teachers can create subject classes");
      }

      await db.transaction(async (tx) => {
        const [newSubject] = await tx
          .insert(subjects)
          .values({
            name: +name,
            code: code,
            description: description,
            status: status,
          })
          .returning({ id: subjects.id });

        await tx.insert(classSubjects).values({
          id: nanoid(),
          enrolledClass: classId,
          subjectId: newSubject.id,
          teacherId: ctx.auth.user.id,
        });
      });
    }),
};
