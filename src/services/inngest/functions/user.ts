// src/inngest/functions/handle-announcement.ts
import { announcement, lessonType } from "@/db/schema";
import { inngest } from "../client";
import { db } from "@/index";
import { eq } from "drizzle-orm";
// import { sendEmail } from "@/services/email"; // Your email service

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
      // db.query.lessonType.findFirst({
      //   where: eq(lessonType.id, lessonTypeId),
      //   columns: { name: true, type: true },
      // });
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

    // Step 3: Insert Announcement
    await step.run("create-announcement-record", async () => {
      await db.insert(announcement).values({
        classId,
        lessonTypeId,
        type: "lesson_publish",
        message: message, // Storing the generated message
        createdBy: teacherId,
      });
    });

    // Step 4: Send Notifications (Email/Push)
  },
);
