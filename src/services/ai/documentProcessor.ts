import { generateText, SYSTEM_PROMPTS } from './openrouter';

export type DocumentType = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt';

export interface DocumentMetadata {
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
  title?: string;
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  summary?: string;
  keyPoints?: string[];
  tables?: Array<{
    headers: string[];
    rows: string[][];
    sheetName?: string;
  }>;
  slides?: Array<{
    slideNumber: number;
    title?: string;
    content: string;
  }>;
}

export interface AIDocumentAnalysis {
  summary: string;
  keyPoints: string[];
  strengths: string[];
  areasForImprovement: string[];
  suggestions: string[];
  quizQuestions?: string[];
  learningObjectives?: string[];
  recommendedActivities?: string[];
}

export function getDocumentType(mimeType: string): DocumentType | null {
  const typeMap: Record<string, DocumentType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt',
  };
  return typeMap[mimeType] ?? null;
}

export function getFileExtension(docType: DocumentType): string {
  const extMap: Record<DocumentType, string> = {
    pdf: '.pdf',
    docx: '.docx',
    doc: '.doc',
    xlsx: '.xlsx',
    xls: '.xls',
    pptx: '.pptx',
    ppt: '.ppt',
  };
  return extMap[docType];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function analyzeDocumentWithAI(
  content: ExtractedContent,
  analysisType: 'summary' | 'quiz' | 'full'
): Promise<AIDocumentAnalysis> {
  let prompt = '';

  if (analysisType === 'summary') {
    prompt = `Analyze the following document and provide a comprehensive summary with key points.

Document: ${content.metadata.fileName}
Type: ${content.metadata.fileType}
Content:
${content.text.substring(0, 8000)}

Provide your analysis in this format:
## Summary
(Brief summary of the document - 2-3 sentences)

## Key Points
(List 5-7 main takeaways from the document)

## Strengths
(List what this document does well)

## Areas for Improvement
(List 3-5 specific suggestions for improvement)`;
  } else if (analysisType === 'quiz') {
    prompt = `Based on the following document content, generate relevant quiz questions that test understanding of the material.

Document: ${content.metadata.fileName}
Type: ${content.metadata.fileType}
Content:
${content.text.substring(0, 8000)}

Generate 5-10 quiz questions covering:
- Multiple choice (4 options)
- True/False
- Short answer
- Essay (if applicable)

Format each question clearly with the correct answer indicated.`;
  } else {
    prompt = `Perform a comprehensive analysis of the following educational document and provide actionable insights for teachers.

Document: ${content.metadata.fileName}
Type: ${content.metadata.fileType}
${content.metadata.pageCount ? `Pages: ${content.metadata.pageCount}` : ''}
${content.metadata.slideCount ? `Slides: ${content.metadata.slideCount}` : ''}
${content.metadata.sheetCount ? `Sheets: ${content.metadata.sheetCount}` : ''}
Content:
${content.text.substring(0, 10000)}

Provide your comprehensive analysis in this format:
## Document Summary
(Brief overview of what this document covers)

## Key Points
(List 5-10 main takeaways)

## Strengths
(What this document does well - content quality, structure, engagement, etc.)

## Areas for Improvement
(Specific suggestions on what to add, remove, or modify)

## Suggested Quiz Questions
(Generate 5 questions that test understanding of this material)

## Recommended Learning Activities
(Suggest engaging activities based on the content)

## Learning Objectives
(Suggest clear, measurable learning objectives aligned with this content)`;
  }

  const result = await generateText(prompt, SYSTEM_PROMPTS.analyzeMaterial);

  return parseAIAnalysisResponse(result, analysisType);
}

function parseAIAnalysisResponse(
  response: string,
  type: 'summary' | 'quiz' | 'full'
): AIDocumentAnalysis {
  const sections = response.split(/^##\s+/m);

  const result: AIDocumentAnalysis = {
    summary: '',
    keyPoints: [],
    strengths: [],
    areasForImprovement: [],
    suggestions: [],
  };

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const title = lines[0].toLowerCase();
    const content = lines.slice(1).join('\n').trim();

    if (title.includes('summary') || title.includes('overview')) {
      result.summary = content;
    } else if (title.includes('key point')) {
      result.keyPoints = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('strength')) {
      result.strengths = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('improvement') || title.includes('Areas')) {
      result.areasForImprovement = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('suggest')) {
      result.suggestions = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('quiz')) {
      result.quizQuestions = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*|^\([a-d]\)/i))
        .map((line) => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('activity')) {
      result.recommendedActivities = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    } else if (title.includes('objective')) {
      result.learningObjectives = content
        .split('\n')
        .filter((line) => line.match(/^\d+\.?\s*|^[-•*]\s*/))
        .map((line) => line.replace(/^\d+\.?\s*|^[-•*]\s*/, '').trim())
        .filter(Boolean);
    }
  }

  return result;
}

export async function extractTextFromContent(
  content: string,
  docType: DocumentType,
  metadata: DocumentMetadata
): Promise<string> {
  const prompt = `Extract and clean the text content from this ${docType} document. 
Return only the extracted text content, organized logically. Remove any OCR artifacts or garbled text.
If there are headers, bullets, or numbered lists, preserve that structure.

Document metadata:
- File: ${metadata.fileName}
- Type: ${docType}
${metadata.pageCount ? `- Pages: ${metadata.pageCount}` : ''}
${metadata.slideCount ? `- Slides: ${metadata.slideCount}` : ''}
${metadata.sheetCount ? `- Sheets: ${metadata.sheetCount}` : ''}

Content:
${content.substring(0, 15000)}

Return the cleaned and organized text:`;

  return await generateText(prompt);
}
