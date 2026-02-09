import {
  lesson,
  lessonType,
  lessonTypeEnum,
  publishStatusEnum,
} from "@/db/schema";
import { db } from "@/index";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import z from "zod";
import { addLessonTeacherSchema } from "../userSchema";
import { inngest } from "@/services/inngest/client";

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

      const [lessonTypeData] = await db
        .insert(lessonType)
        .values({
          lessonId: lessonData.id,
          type: lessonTypeEnum,
        })
        .returning();

      return { lessonData, lessonTypeData };
    }),
  updateLessonType: protectedProcedure
    .input(
      addLessonTeacherSchema.extend({
        status: z.enum(publishStatusEnum.enumValues).nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      const { lessonId, title, markDownDescription, lessonTypeId, status } =
        input;

      const updatedData = await db
        .update(lessonType)
        .set({
          name: title,
          markup: markDownDescription,
          lessonId: +lessonId,
          status: status ? status : undefined,
        })
        .where(eq(lessonType.id, lessonTypeId));

      await inngest.send({
        name: "uploadthing/markup.image.upload",
        data: { lessonTypeId, markup: markDownDescription },
      });
    }),
  deleteLessonType: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== "teacher") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not Authorize" });
      }

      const { lessonTypeId } = input;

      await db.delete(lessonType).where(eq(lessonType.id, lessonTypeId));
    }),
};
