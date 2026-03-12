// src/inngest/functions/handle-announcement.ts
import { announcement, lessonType } from "@/db/schema";
import { inngest } from "../client";
import { db } from "@/index";
import { eq, sql } from "drizzle-orm"; // Added 'sql' import

export const handleLessonPublished = inngest.createFunction(
  { id: "handle-lesson-published" },
  { event: "lesson/published" },
  async ({ event, step }) => {
    const { lessonTypeId, classId, teacherId } = event.data;

    // Step 1: Get Lesson Details to determine type (Quiz/Assignment/Handout)
    const [lessonDetails] = await step.run("get-lesson-details", async () => {
      return await db
        .select({
          name: lessonType.name,
          type: lessonType.type,
        })
        .from(lessonType)
        .where(eq(lessonType.id, lessonTypeId))
        .limit(1);
    });

    if (!lessonDetails) throw new Error("Lesson not found");

    // Step 2: Generate Custom Message based on Lesson Type
    const message = await step.run("generate-message", async () => {
      const typeLabel =
        lessonDetails.type.charAt(0).toUpperCase() +
        lessonDetails.type.slice(1);
      // Example: "New Quiz: Biology 101" or "New Assignment: Essay Draft"
      return `New ${typeLabel}: ${lessonDetails.name || "Untitled"}`;
    });

    // Step 3: Upsert Announcement (Update if exists, Insert if new)
    await step.run("upsert-announcement-record", async () => {
      await db
        .insert(announcement)
        .values({
          classId,
          lessonTypeId,
          type: "lesson_publish",
          message: message,
          createdBy: teacherId,
        })
        .onConflictDoUpdate({
          // The target columns must match your unique index definition
          target: [announcement.classId, announcement.lessonTypeId],
          // What to update if the record already exists
          set: {
            message: sql`excluded.message`,
            // We typically do not update 'createdBy' or 'createdAt' on an update
          },
        });
    });

    // Step 4: Send Notifications (Email/Push) - Future implementation
  },
);
