import { inngest } from '../client';
import { generateText, SYSTEM_PROMPTS } from '@/services/ai/openrouter';
import { lessonType } from '@/db/schema';
import { db } from '@/index';
import { eq } from 'drizzle-orm';
import {
  getDocumentType,
  formatFileSize,
  type DocumentType,
  type ExtractedContent,
  type DocumentMetadata,
  type AIDocumentAnalysis,
  analyzeDocumentWithAI,
} from '@/services/ai/documentProcessor';

export const generateQuestionsFromMaterial = inngest.createFunction(
  { id: 'ai-generate-questions', retries: 3 },
  { event: 'ai/generate.questions' },
  async ({ event, step }) => {
    const { lessonTypeId, materialContent, questionType, count } = event.data;

    const questionTypes =
      questionType === 'all'
        ? ['multiple choice', 'true/false', 'short answer', 'essay']
        : [questionType.replace('_', ' ')];

    const prompt = await step.run('build-prompt', async () => {
      return `Based on the following learning material, generate ${count} ${questionTypes.join(', ')} question(s).

Learning Material:
${materialContent}

Please generate questions that:
1. Are aligned with the content
2. Are appropriate for the grade level
3. Include clear instructions
4. For multiple choice, include 4 options with the correct answer marked

Format your response clearly with numbered questions.`;
    });

    const result = await step.run('call-ai', async () => {
      return await generateText(prompt, SYSTEM_PROMPTS.generateQuestions);
    });

    await step.run('save-result', async () => {
      await db
        .update(lessonType)
        .set({ aiGeneratedQuestions: result })
        .where(eq(lessonType.id, lessonTypeId));
    });

    return { success: true, result, lessonTypeId };
  }
);

export const analyzeMaterialQuality = inngest.createFunction(
  { id: 'ai-analyze-material', retries: 3 },
  { event: 'ai/analyze.material' },
  async ({ event, step }) => {
    const { lessonTypeId, materialContent, materialType } = event.data;

    const prompt = await step.run('build-prompt', async () => {
      return `Analyze the following ${materialType} material and provide detailed feedback.

Material:
${materialContent}

Provide your analysis in the following format:
## Strengths
(List the strengths of this material)

## Areas for Improvement
(List specific suggestions for improvement)

## What to Add
(Suggest content that should be added)

## What to Remove
(Suggest content that should be removed or simplified)

## Alignment with DepEd Standards
(Assess alignment with Philippine curriculum standards)

## Overall Rating: X/5
(Provide an overall quality rating)`;
    });

    const result = await step.run('call-ai', async () => {
      return await generateText(prompt, SYSTEM_PROMPTS.analyzeMaterial);
    });

    await step.run('save-result', async () => {
      await db
        .update(lessonType)
        .set({ aiAnalysis: result })
        .where(eq(lessonType.id, lessonTypeId));
    });

    return { success: true, result, lessonTypeId };
  }
);

export const improveLessonPlan = inngest.createFunction(
  { id: 'ai-improve-lesson-plan', retries: 3 },
  { event: 'ai/improve.lesson_plan' },
  async ({ event, step }) => {
    const { lessonTypeId, lessonPlanContent, subject, gradeLevel } = event.data;

    const prompt = await step.run('build-prompt', async () => {
      return `As an expert Filipino educator, analyze and improve the following ${subject} lesson plan for Grade ${gradeLevel}.

Lesson Plan:
${lessonPlanContent}

Provide your suggestions in the following format:
## Suggested Improvements

### 1. Learning Objectives
(Suggest clearer, more measurable objectives)

### 2. Content Structure
(Suggest how to better organize the content)

### 3. Teaching Strategies
(Suggest more engaging, differentiated instruction methods)

### 4. Assessment Strategies
(Suggest formative and summative assessment ideas)

### 5. Activities
(Suggest additional or improved activities)

### 6. Materials & Resources
(Suggest relevant DepEd-aligned resources)

### 7. Time Management
(Suggest how to better allocate time)

### 8. Inclusive Practices
(Suggest how to make the lesson more inclusive for all learners)

Please provide specific, actionable suggestions that align with DepEd guidelines.`;
    });

    const result = await step.run('call-ai', async () => {
      return await generateText(prompt, SYSTEM_PROMPTS.improveLessonPlan);
    });

    await step.run('save-result', async () => {
      await db
        .update(lessonType)
        .set({ aiSuggestions: result })
        .where(eq(lessonType.id, lessonTypeId));
    });

    return { success: true, result, lessonTypeId };
  }
);

export const generateLearningMaterial = inngest.createFunction(
  { id: 'ai-generate-material', retries: 3 },
  { event: 'ai/generate.material' },
  async ({ event, step }) => {
    const { lessonTypeId, topic, subject, gradeLevel, materialType } = event.data;

    const prompt = await step.run('build-prompt', async () => {
      const typeSpecificInstructions = {
        quiz: 'Create a quiz with various question types (multiple choice, true/false, short answer)',
        assignment: 'Create an assignment with clear instructions and rubric criteria',
        handout: 'Create an educational handout with key information and visual aids suggestions',
        module: 'Create a comprehensive learning module with all sections below',
      };

      return `As an expert Filipino instructional designer, create a ${materialType} for ${subject} on the topic of "${topic}" for Grade ${gradeLevel} students.

Follow the DepEd curriculum standards for the Philippine educational system.

${typeSpecificInstructions[materialType]}

Include the following sections as appropriate:
## Learning Objectives
(Use ABCD format: Audience, Behavior, Condition, Degree)

## Content Overview
(Brief summary of the topic)

## Key Concepts
(List main concepts to cover)

## Activities
(Suggest engaging, age-appropriate activities)

## Assessments
(Suggest formative and summative assessments)

## Materials Needed
(List required materials and resources)

## Teacher Notes
(Important reminders and tips for implementation)`;
    });

    const result = await step.run('call-ai', async () => {
      return await generateText(prompt, SYSTEM_PROMPTS.generateMaterial);
    });

    await step.run('save-result', async () => {
      await db
        .update(lessonType)
        .set({ aiGeneratedMaterial: result })
        .where(eq(lessonType.id, lessonTypeId));
    });

    return { success: true, result, lessonTypeId };
  }
);

export const processDocument = inngest.createFunction(
  { id: 'ai-process-document', retries: 3 },
  { event: 'ai/process.document' },
  async ({ event, step }) => {
    const { lessonTypeId, fileUrl, fileType, fileName, fileSize, analysisType } = event.data;

    const docType = await step.run('validate-document', async () => {
      const type = getDocumentType(fileType);
      if (!type) {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      return type;
    });

    const metadata: DocumentMetadata = {
      fileName,
      fileType: docType,
      fileSize,
    };

    const extractedContent = await step.run('extract-content', async () => {
      const response = await fetch(fileUrl, {
        headers: { 'User-Agent': 'ALMS-Learning-Management-System/1.0' },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Basic text extraction - simplified version
      let text = '';
      try {
        const str = buffer.toString('utf-8');
        // Remove non-printable characters but keep structure
        text = str
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch {
        text = '[Unable to extract text from file]';
      }

      return {
        text: text.substring(0, 15000), // Limit text size for AI processing
        metadata,
        summary: text.substring(0, 500),
      } as ExtractedContent;
    });

    const analysis = await step.run('analyze-document', async () => {
      return await analyzeDocumentWithAI(extractedContent, analysisType || 'full');
    });

    const result = await step.run('prepare-result', async () => {
      const resultObj = {
        fileName,
        fileType: docType,
        fileSize: formatFileSize(fileSize),
        content: extractedContent.text.substring(0, 5000),
        analysis,
      };

      // Store analysis in lesson type
      await db
        .update(lessonType)
        .set({
          aiAnalysis: JSON.stringify({
            documentAnalysis: analysis,
            fileName,
            fileType: docType,
            processedAt: new Date().toISOString(),
          }),
        })
        .where(eq(lessonType.id, lessonTypeId));

      return resultObj;
    });

    return { success: true, result, lessonTypeId };
  }
);

export const processBatchDocuments = inngest.createFunction(
  { id: 'ai-process-batch-documents', retries: 2 },
  { event: 'ai/process.batch.documents' },
  async ({ event, step }) => {
    const { lessonTypeId, files, analysisType } = event.data;

    const results = await step.run('process-files', async () => {
      const processedResults = [];

      for (const file of files) {
        try {
          const docType = getDocumentType(file.fileType);
          if (!docType) {
            processedResults.push({
              fileName: file.fileName,
              fileType: file.fileType,
              success: false,
              error: `Unsupported file type: ${file.fileType}`,
            });
            continue;
          }

          const metadata: DocumentMetadata = {
            fileName: file.fileName,
            fileType: docType,
            fileSize: file.fileSize,
          };

          // Download file
          const response = await fetch(file.fileUrl, {
            headers: { 'User-Agent': 'ALMS-Learning-Management-System/1.0' },
          });

          if (!response.ok) {
            processedResults.push({
              fileName: file.fileName,
              success: false,
              error: `Download failed: ${response.statusText}`,
            });
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Extract text
          let text = '';
          try {
            const str = buffer.toString('utf-8');
            text = str
              .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          } catch {
            text = '[Unable to extract text]';
          }

          const extractedContent: ExtractedContent = {
            text: text.substring(0, 15000),
            metadata,
            summary: text.substring(0, 500),
          };

          // Analyze
          const analysis = await analyzeDocumentWithAI(extractedContent, analysisType || 'summary');

          processedResults.push({
            fileName: file.fileName,
            fileType: docType,
            fileSize: formatFileSize(file.fileSize),
            success: true,
            summary: analysis.summary,
            keyPoints: analysis.keyPoints.slice(0, 5),
            questionCount: analysis.quizQuestions?.length || 0,
          });
        } catch (error) {
          processedResults.push({
            fileName: file.fileName,
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed',
          });
        }
      }

      return processedResults;
    });

    // Store batch summary
    await step.run('save-batch-summary', async () => {
      const successfulCount = results.filter((r: { success: boolean }) => r.success).length;
      const failedCount = results.filter((r: { success: boolean }) => !r.success).length;

      await db
        .update(lessonType)
        .set({
          aiGeneratedMaterial: JSON.stringify({
            batchProcessing: {
              totalFiles: files.length,
              successful: successfulCount,
              failed: failedCount,
              processedAt: new Date().toISOString(),
              results,
            },
          }),
        })
        .where(eq(lessonType.id, lessonTypeId));
    });

    return { success: true, results, lessonTypeId };
  }
);
