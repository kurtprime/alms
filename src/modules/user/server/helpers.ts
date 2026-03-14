import {
  quiz,
  quizAnswerOption,
  quizMatchingPair,
  quizOrderingItem,
  quizQuestion,
} from '@/db/schema';
import { db } from '@/index';
import { eq } from 'drizzle-orm';
import { quizSettingsSchema } from './userSchema';
import z from 'zod';
import { nanoid } from 'nanoid';

export async function deepCloneQuiz(
  sourceQuizId: number,
  targetLessonTypeId: number,
  newSettings: z.infer<typeof quizSettingsSchema>
) {
  return await db.transaction(async (tx) => {
    // 1. Fetch Source Quiz
    const [source] = await tx.select().from(quiz).where(eq(quiz.id, sourceQuizId));
    if (!source) throw new Error('Source quiz not found');

    // 2. Fetch Source Questions FIRST (to calculate total score)
    const questions = await tx
      .select()
      .from(quizQuestion)
      .where(eq(quizQuestion.quizId, sourceQuizId));

    // 3. Calculate Total Score from Question Points
    const calculatedTotalScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // 4. Create NEW Quiz with calculated score
    const [newQuiz] = await tx
      .insert(quiz)
      .values({
        name: source.name,
        description: source.description,
        lessonTypeId: targetLessonTypeId,
        createdBy: source.createdBy,
        status: 'published',

        // ✅ USE CALCULATED SCORE
        score: calculatedTotalScore,

        // Apply overrides from input settings
        timeLimit: newSettings.timeLimit,
        maxAttempts: newSettings.maxAttempts,
        shuffleQuestions: newSettings.shuffleQuestions,
        showScoreAfterSubmission: newSettings.showScoreAfterSubmission,
        showCorrectAnswers: newSettings.showCorrectAnswers,
        startDate: newSettings.startDate ? new Date(newSettings.startDate) : null,
        endDate: newSettings.endDate ? new Date(newSettings.endDate) : null,
      })
      .returning();

    // 5. Clone Questions (Iterate over fetched questions, no need to re-fetch)
    for (const q of questions) {
      // Insert New Question
      const [newQ] = await tx
        .insert(quizQuestion)
        .values({
          quizId: newQuiz.id,
          question: q.question,
          type: q.type,
          points: q.points,
          orderIndex: q.orderIndex,
          imageBase64Jpg: q.imageBase64Jpg,
          explanation: q.explanation,
          hint: q.hint,
          required: q.required,
          correctBoolean: q.correctBoolean,
        })
        .returning();

      // 6. Clone Children based on Type
      if (q.type === 'multiple_choice') {
        const options = await tx
          .select()
          .from(quizAnswerOption)
          .where(eq(quizAnswerOption.questionId, q.id));
        if (options.length > 0) {
          await tx.insert(quizAnswerOption).values(
            options.map((opt) => ({
              id: `${nanoid(8)}`,
              questionId: newQ.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              points: opt.points,
              imageBase64Jpg: opt.imageBase64Jpg,
              feedback: opt.feedback,
            }))
          );
        }
      } else if (q.type === 'matching') {
        const pairs = await tx
          .select()
          .from(quizMatchingPair)
          .where(eq(quizMatchingPair.questionId, q.id));
        if (pairs.length > 0) {
          await tx.insert(quizMatchingPair).values(
            pairs.map((p) => ({
              id: `${nanoid(8)}`,
              questionId: newQ.id,
              leftItem: p.leftItem,
              rightItem: p.rightItem,
              points: p.points,
              leftImageBase64Jpg: p.leftImageBase64Jpg,
              rightImageBase64Jpg: p.rightImageBase64Jpg,
            }))
          );
        }
      } else if (q.type === 'ordering') {
        const items = await tx
          .select()
          .from(quizOrderingItem)
          .where(eq(quizOrderingItem.questionId, q.id));
        if (items.length > 0) {
          await tx.insert(quizOrderingItem).values(
            items.map((i) => ({
              id: `${nanoid(8)}`,
              questionId: newQ.id,
              itemText: i.itemText,
              correctPosition: i.correctPosition,
              points: i.points,
              imageBase64Jpg: i.imageBase64Jpg,
            }))
          );
        }
      }
    }

    return newQuiz;
  });
}
