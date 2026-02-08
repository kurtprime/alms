import { lesson, lessonType, lessonTypeEnum } from "@/db/schema";
import { db } from "@/index";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import z from "zod";

export const lessonActions = {
  createLessonType: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        lessonTypeEnum: z.enum(lessonTypeEnum.enumValues),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({ code: "FORBIDDEN", message: "not Authorize" });
      }
      const { classId, lessonTypeEnum } = input;

      const lessonData = await db.transaction(async (tx) => {
        // Check if draft exists for this classId
        const existingDraft = await tx
          .select()
          .from(lesson)
          .where(
            and(eq(lesson.classSubjectId, classId), eq(lesson.status, "draft")),
          )
          .limit(1);

        if (existingDraft.length > 0) {
          // Return existing draft
          return existingDraft[0];
        }

        // Create new draft
        const newLesson = await tx
          .insert(lesson)
          .values({
            classSubjectId: classId,
            status: "draft",
            terms: null,
            name: "",
          })
          .returning();

        return newLesson[0];
      });

      const lessonTypeData = await db
        .insert(lessonType)
        .values({
          lessonId: lessonData.id,
          type: lessonTypeEnum,
        })
        .returning();

      return { lessonData, lessonTypeData };
    }),
  deleteLessonType: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not Authorize" });
      }

      const { lessonId } = input;

      await db.delete(lesson).where(eq(lesson.id, +lessonId));
    }),
};
