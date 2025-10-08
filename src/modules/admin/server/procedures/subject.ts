import { adminProcedure } from "@/trpc/init";
import { createSubjectSchema, newSubjectNameSchema } from "../adminSchema";
import { db } from "@/index";
import { subjectName } from "@/db/schema";

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
};
