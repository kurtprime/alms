// src/inngest/functions/handle-announcement.ts
import { announcement, lessonType, quizAttempt } from '@/db/schema';
import { inngest } from '../client';
import { db } from '@/index';
import { eq, sql } from 'drizzle-orm'; // Added 'sql' import

export const handleLessonPublished = inngest.createFunction(
  { id: 'handle-lesson-published' },
  { event: 'lesson/published' },
  async ({ event, step }) => {
    const { lessonTypeId, classId, teacherId } = event.data;

    // Step 1: Get Lesson Details to determine type (Quiz/Assignment/Handout)
    const [lessonDetails] = await step.run('get-lesson-details', async () => {
      return await db
        .select({
          name: lessonType.name,
          type: lessonType.type,
        })
        .from(lessonType)
        .where(eq(lessonType.id, lessonTypeId))
        .limit(1);
    });

    if (!lessonDetails) throw new Error('Lesson not found');

    // Step 2: Generate Custom Message based on Lesson Type
    const message = await step.run('generate-message', async () => {
      const typeLabel = lessonDetails.type.charAt(0).toUpperCase() + lessonDetails.type.slice(1);
      // Example: "New Quiz: Biology 101" or "New Assignment: Essay Draft"
      return `New ${typeLabel}: ${lessonDetails.name || 'Untitled'}`;
    });

    // Step 3: Upsert Announcement (Update if exists, Insert if new)
    await step.run('upsert-announcement-record', async () => {
      await db
        .insert(announcement)
        .values({
          classId,
          lessonTypeId,
          type: 'lesson_publish',
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
  }
);

export const handleQuizTimer = inngest.createFunction(
  { id: 'handle-quiz-timer' },
  { event: 'quiz/started' },
  async ({ event, step }) => {
    const { attemptId, durationInMinutes } = event.data;

    // 1. Determine Sleep Duration
    // If no time limit is set, default to 12 hours ('12h') to clean up abandoned attempts.
    // Otherwise, use the specific duration in minutes.
    const sleepDuration =
      durationInMinutes && durationInMinutes > 0 ? `${durationInMinutes}m` : '12h';

    // 2. Sleep
    await step.sleep('sleep-until-expiry', sleepDuration);

    // 3. Wake up & Check status
    const [attempt] = await step.run('check-attempt-status', async () => {
      return db
        .select({ status: quizAttempt.status })
        .from(quizAttempt)
        .where(eq(quizAttempt.id, attemptId));
    });

    // 4. If still 'in_progress', mark as 'expired'
    if (attempt && attempt.status === 'in_progress') {
      await step.run('expire-attempt', async () => {
        await db
          .update(quizAttempt)
          .set({
            status: 'expired',
            submittedAt: new Date(),
          })
          .where(eq(quizAttempt.id, attemptId));
      });

      return { success: true, action: 'expired' };
    }

    // If already submitted/graded, we do nothing
    return { success: true, action: 'no_action' };
  }
);
