import {
  classSubjects,
  lesson,
  lessonType,
  lessonTypeEnum,
  subjectName,
  subjects,
  lessonDocument,
} from '@/db/schema';
import { db } from '@/index';
import { protectedProcedure } from '@/trpc/init';
import { inngest } from '@/services/inngest/client';
import { eq, and, inArray } from 'drizzle-orm';
import z from 'zod';

export const aiActions = {
  generateQuestions: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        materialContent: z.string().min(1),
        questionType: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay', 'all']),
        count: z.number().min(1).max(20).default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      await inngest.send({
        name: 'ai/generate.questions',
        data: {
          lessonTypeId: input.lessonTypeId,
          teacherId: ctx.auth.user.id,
          materialContent: input.materialContent,
          questionType: input.questionType,
          count: input.count,
        },
      });

      return {
        success: true,
        message: 'Question generation started. Results will be available shortly.',
      };
    }),

  analyzeMaterial: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        materialContent: z.string().min(1),
        materialType: z.enum(['quiz', 'assignment', 'handout', 'module']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      await inngest.send({
        name: 'ai/analyze.material',
        data: {
          lessonTypeId: input.lessonTypeId,
          teacherId: ctx.auth.user.id,
          materialContent: input.materialContent,
          materialType: input.materialType,
        },
      });

      return {
        success: true,
        message: 'Material analysis started. Results will be available shortly.',
      };
    }),

  improveLessonPlan: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        lessonPlanContent: z.string().min(1),
        subject: z.string(),
        gradeLevel: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      await inngest.send({
        name: 'ai/improve.lesson_plan',
        data: {
          lessonTypeId: input.lessonTypeId,
          teacherId: ctx.auth.user.id,
          lessonPlanContent: input.lessonPlanContent,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
        },
      });

      return {
        success: true,
        message: 'Lesson plan improvement started. Results will be available shortly.',
      };
    }),

  generateMaterial: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        topic: z.string().min(1),
        subject: z.string(),
        gradeLevel: z.string(),
        materialType: z.enum(['quiz', 'assignment', 'handout', 'module']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      await inngest.send({
        name: 'ai/generate.material',
        data: {
          lessonTypeId: input.lessonTypeId,
          teacherId: ctx.auth.user.id,
          topic: input.topic,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          materialType: input.materialType,
        },
      });

      return {
        success: true,
        message: 'Material generation started. Results will be available shortly.',
      };
    }),

  getLessonWithAIResults: protectedProcedure
    .input(z.object({ lessonTypeId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can access this');
      }

      const result = await db
        .select()
        .from(lessonType)
        .where(eq(lessonType.id, input.lessonTypeId))
        .limit(1);

      if (!result.length) {
        throw new Error('Lesson not found');
      }

      return result[0];
    }),

  getTeacherLessonsForAI: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.auth.user.role !== 'teacher') {
      throw new Error('Only teachers can access this');
    }

    const userId = ctx.auth.user.id;

    const lessons = await db
      .select({
        lessonTypeId: lessonType.id,
        lessonName: lessonType.name,
        lessonType: lessonType.type,
        classSubjectId: lesson.classSubjectId,
        className: subjectName.name,
        aiGeneratedQuestions: lessonType.aiGeneratedQuestions,
        aiAnalysis: lessonType.aiAnalysis,
        aiSuggestions: lessonType.aiSuggestions,
        aiGeneratedMaterial: lessonType.aiGeneratedMaterial,
      })
      .from(lessonType)
      .innerJoin(lesson, eq(lesson.id, lessonType.lessonId))
      .innerJoin(classSubjects, eq(classSubjects.id, lesson.classSubjectId))
      .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
      .innerJoin(subjectName, eq(subjectName.id, subjects.name))
      .where(eq(classSubjects.teacherId, userId));

    return lessons;
  }),

  getLessonDocuments: protectedProcedure
    .input(z.object({ lessonTypeId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can access this');
      }

      const docs = await db
        .select()
        .from(lessonDocument)
        .where(eq(lessonDocument.lessonTypeId, input.lessonTypeId));

      return docs;
    }),

  processDocument: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        fileUrl: z.string().url(),
        fileType: z.string(),
        fileName: z.string(),
        fileSize: z.number().max(50 * 1024 * 1024), // 50MB max
        analysisType: z.enum(['summary', 'quiz', 'full']).default('full'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
      ];

      if (!validTypes.includes(input.fileType)) {
        throw new Error(
          `Unsupported file type: ${input.fileType}. Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX`
        );
      }

      await inngest.send({
        name: 'ai/process.document',
        data: {
          teacherId: ctx.auth.user.id,
          lessonTypeId: input.lessonTypeId,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileName: input.fileName,
          fileSize: input.fileSize,
          analysisType: input.analysisType,
        },
      });

      return {
        success: true,
        message: 'Document processing started. Results will be available shortly.',
      };
    }),

  processBatchDocuments: protectedProcedure
    .input(
      z.object({
        lessonTypeId: z.number(),
        files: z
          .array(
            z.object({
              fileUrl: z.string().url(),
              fileType: z.string(),
              fileName: z.string(),
              fileSize: z.number().max(50 * 1024 * 1024),
            })
          )
          .max(10),
        analysisType: z.enum(['summary', 'quiz', 'full']).default('summary'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.auth.user.role !== 'teacher') {
        throw new Error('Only teachers can use this feature');
      }

      // Validate file types
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
      ];

      for (const file of input.files) {
        if (!validTypes.includes(file.fileType)) {
          throw new Error(
            `Unsupported file type: ${file.fileType}. Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX`
          );
        }
      }

      await inngest.send({
        name: 'ai/process.batch.documents',
        data: {
          teacherId: ctx.auth.user.id,
          lessonTypeId: input.lessonTypeId,
          files: input.files,
          analysisType: input.analysisType,
        },
      });

      return {
        success: true,
        message: `Processing ${input.files.length} document(s) started. Results will be available shortly.`,
      };
    }),
};
