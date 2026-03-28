import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDocumentType,
  formatFileSize,
  type DocumentType,
  type ExtractedContent,
  type DocumentMetadata,
  type AIDocumentAnalysis,
  analyzeDocumentWithAI,
} from '@/services/ai/documentProcessor';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession();

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileUrl = formData.get('fileUrl') as string | null;
    const fileType = formData.get('fileType') as string | null;
    const analysisType = (formData.get('analysisType') as 'summary' | 'quiz' | 'full') || 'full';
    const fileName = (formData.get('fileName') as string) || 'document';
    const fileSize = parseInt(formData.get('fileSize') as string) || 0;

    // Validate inputs
    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 });
    }

    const docType = getDocumentType(fileType);
    if (!docType) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${fileType}. Supported types: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT`,
        },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` },
        { status: 400 }
      );
    }

    // Download the file
    const fileResponse = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'ALMS-Learning-Management-System/1.0',
      },
    });

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download file: ${fileResponse.statusText}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract content based on file type
    const extractedContent = await extractDocumentContent(buffer, docType, {
      fileName,
      fileType: docType,
      fileSize,
    });

    // Analyze with AI
    const analysis = await analyzeDocumentWithAI(extractedContent, analysisType);

    return NextResponse.json({
      success: true,
      fileName,
      fileType: docType,
      fileSize: formatFileSize(fileSize),
      content: extractedContent,
      analysis,
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}

async function extractDocumentContent(
  buffer: Buffer,
  docType: DocumentType,
  metadata: DocumentMetadata
): Promise<ExtractedContent> {
  // Basic text extraction - in production, you'd use libraries like:
  // - pdf-parse for PDFs
  // - mammoth for DOCX/DOC
  // - xlsx for Excel files
  // - pptx for PowerPoint files

  // For now, we'll extract whatever text we can from the buffer
  // and rely on AI to clean and structure it

  let text = '';
  let extractedMetadata = { ...metadata };

  switch (docType) {
    case 'pdf':
      text = await extractPDFText(buffer);
      break;
    case 'docx':
    case 'doc':
      text = await extractWordText(buffer);
      break;
    case 'xlsx':
    case 'xls':
      text = await extractExcelText(buffer);
      break;
    case 'pptx':
    case 'ppt':
      text = await extractPowerPointText(buffer);
      break;
    default:
      // Try to extract any readable text
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
  }

  // Clean up the text
  text = text.replace(/\s+/g, ' ').trim();

  // If we couldn't extract meaningful content, provide guidance
  if (text.length < 50) {
    text = `[Content could not be automatically extracted from this ${docType.toUpperCase()} file. 
The AI will analyze what it can, but for better results, please ensure the file is not corrupted or password-protected.
File: ${metadata.fileName}
Type: ${metadata.fileType}]`;
  }

  return {
    text,
    metadata: extractedMetadata,
    summary: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
  };
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  // Basic PDF text extraction
  // In production, use pdf-parse library
  try {
    const str = buffer.toString('latin1');
    const textMatches = str.match(/BT[\s\S]*?ET/g) || [];
    let text = '';

    for (const match of textMatches) {
      const strings = match.match(/\(([^)]+)\)/g) || [];
      for (const s of strings) {
        text += s.replace(/[()\\]/g, '') + ' ';
      }
    }

    return text.trim() || buffer.toString('utf-8').substring(0, 5000);
  } catch {
    return buffer.toString('utf-8').substring(0, 5000);
  }
}

async function extractWordText(buffer: Buffer): Promise<string> {
  // Basic Word document text extraction
  // In production, use mammoth library
  try {
    const str = buffer.toString('utf-8');
    // Look for XML content in DOCX/DOC
    const xmlMatch = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/gi) || [];
    return xmlMatch.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
  } catch {
    return buffer.toString('utf-8').substring(0, 5000);
  }
}

async function extractExcelText(buffer: Buffer): Promise<string> {
  // Basic Excel text extraction
  // In production, use xlsx library
  try {
    const str = buffer.toString('utf-8');
    // Look for shared strings or cell values
    const cellMatches = str.match(/<c[^>]*>([^<]+)<\/c>/gi) || [];
    const valueMatches = str.match(/<v>([^<]+)<\/v>/gi) || [];
    return [...cellMatches, ...valueMatches].map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
  } catch {
    return buffer.toString('utf-8').substring(0, 5000);
  }
}

async function extractPowerPointText(buffer: Buffer): Promise<string> {
  // Basic PowerPoint text extraction
  // In production, use pptx library
  try {
    const str = buffer.toString('utf-8');
    // Look for slide text
    const textMatches = str.match(/<a:t>([^<]+)<\/a:t>/gi) || [];
    return textMatches.map((m) => m.replace(/<[^>]+>/g, '')).join('\n');
  } catch {
    return buffer.toString('utf-8').substring(0, 5000);
  }
}
