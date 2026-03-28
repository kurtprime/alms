import { updateMarkUp } from '@/modules/admin/server/adminSchema';
import { EventSchemas, Inngest } from 'inngest';
import z from 'zod';

type InngestEvents = {
  'uploadthing/markup.image.upload': {
    data: z.infer<typeof updateMarkUp>;
  };
  'test/connection': {
    data: undefined;
  };
  'lesson/published': {
    data: {
      lessonTypeId: number;
      classId: string;
      teacherId: string;
    };
  };
  'quiz/started': {
    data: {
      attemptId: number;
      durationInMinutes: number;
    };
  };
  'ai/generate.questions': {
    data: {
      lessonTypeId: number;
      teacherId: string;
      materialContent: string;
      questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'all';
      count: number;
    };
  };
  'ai/analyze.material': {
    data: {
      lessonTypeId: number;
      teacherId: string;
      materialContent: string;
      materialType: 'quiz' | 'assignment' | 'handout' | 'module';
    };
  };
  'ai/improve.lesson_plan': {
    data: {
      lessonTypeId: number;
      teacherId: string;
      lessonPlanContent: string;
      subject: string;
      gradeLevel: string;
    };
  };
  'ai/generate.material': {
    data: {
      lessonTypeId: number;
      teacherId: string;
      topic: string;
      subject: string;
      gradeLevel: string;
      materialType: 'quiz' | 'assignment' | 'handout' | 'module';
    };
  };
  'ai/process.document': {
    data: {
      teacherId: string;
      lessonTypeId: number;
      fileUrl: string;
      fileType: string;
      fileName: string;
      fileSize: number;
      analysisType: 'summary' | 'quiz' | 'full';
    };
  };
  'ai/process.batch.documents': {
    data: {
      teacherId: string;
      lessonTypeId: number;
      files: Array<{
        fileUrl: string;
        fileType: string;
        fileName: string;
        fileSize: number;
      }>;
      analysisType: 'summary' | 'quiz' | 'full';
    };
  };
};

export const inngest = new Inngest({
  id: 'learning-management-system',
  // eventKey: process.env.INNGEST_EVENT_KEY, // Your generated event key
  // signingKey: process.env.INNGEST_SIGNING_KEY,
  schemas: new EventSchemas().fromRecord<InngestEvents>(),
});
