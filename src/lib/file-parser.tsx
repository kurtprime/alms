import { FileText, FileSpreadsheet, Presentation, File } from 'lucide-react';
import * as XLSX from 'xlsx';

export type DocumentType = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt';

export interface ParsedFile {
  id: string;
  file: File;
  name: string;
  type: DocumentType;
  size: number;
  content: string;
  status: 'pending' | 'parsing' | 'complete' | 'error';
  error?: string;
}

const ACCEPTED_TYPES: Record<string, DocumentType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
};

export function getDocumentType(mimeType: string): DocumentType | null {
  return ACCEPTED_TYPES[mimeType] ?? null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(type: DocumentType | string) {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <Presentation className="h-5 w-5 text-orange-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

async function extractTextFromZip(
  buffer: ArrayBuffer,
  fileName: string,
  xmlFilePattern: RegExp,
  textExtractionFn: (xml: string) => string
): Promise<string> {
  try {
    const jszip = await import('jszip');
    const zip = await jszip.loadAsync(buffer);
    const xmlFiles = Object.keys(zip.files).filter((name) => xmlFilePattern.test(name));

    const texts: string[] = [];
    for (const xmlFile of xmlFiles) {
      const xmlContent = await zip.files[xmlFile].async('string');
      texts.push(textExtractionFn(xmlContent));
    }

    const result = texts.join('\n\n').trim();
    if (result.length < 20) {
      return `[Limited text content extracted from ${fileName}. The file may contain images or formatted content that could not be extracted as plain text.]`;
    }
    return result.substring(0, 50000);
  } catch {
    throw new Error(`Failed to extract content from ${fileName}`);
  }
}

function extractTextFromDocxXml(xml: string): string {
  const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  return textMatches
    .map((match) => {
      const content = match.replace(/<[^>]+>/g, '');
      return content;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextFromPptxXml(xml: string): string {
  const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
  return textMatches
    .map((match) => match.replace(/<[^>]+>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractTextFromExcel(buffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      if (csv.trim()) {
        sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`);
      }
    }

    const result = sheets.join('\n\n').trim();
    if (result.length < 20) {
      return `[No readable content found in ${fileName}]`;
    }
    return result.substring(0, 50000);
  } catch {
    throw new Error(`Failed to parse Excel file ${fileName}`);
  }
}

async function extractTextFromPdf(buffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(buffer);

    const textContent: string[] = [];
    const streamMatch = text.match(/stream[\s\S]*?endstream/gi) || [];

    for (const stream of streamMatch) {
      const cleanedStream = stream
        .replace(/^stream\s*/, '')
        .replace(/\s*endstream$/, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
        .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, ' ')
        .trim();

      if (cleanedStream.length > 10) {
        textContent.push(cleanedStream);
      }
    }

    let result = textContent.join(' ').replace(/\s+/g, ' ').trim();

    if (result.length < 50) {
      const btMatches = text.match(/BT[\s\S]*?ET/gi) || [];
      const extractedText: string[] = [];

      for (const bt of btMatches) {
        const tjMatches = bt.match(/\(([^)]*)\)\s*Tj/gi) || [];
        for (const match of tjMatches) {
          const parenContent = match.match(/\(([^)]*)\)/);
          if (parenContent && parenContent[1]) {
            const cleaned = parenContent[1]
              .replace(/\\[nrt]|- /g, ' ')
              .replace(/[^\x20-\x7E]/g, '')
              .trim();
            if (cleaned) extractedText.push(cleaned);
          }
        }
      }
      result = extractedText.join(' ').replace(/\s+/g, ' ').trim();
    }

    if (result.length < 50) {
      return `[Limited text content extracted from ${fileName}. The PDF may contain scanned images or complex formatting. Try using a text-based document for better results.]`;
    }

    return result.substring(0, 50000);
  } catch {
    throw new Error(`Failed to parse PDF file ${fileName}`);
  }
}

export async function parseFile(file: File): Promise<{ content: string; type: DocumentType }> {
  const docType = getDocumentType(file.type);

  if (!docType) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  const buffer = await file.arrayBuffer();

  switch (docType) {
    case 'xlsx':
    case 'xls': {
      return {
        content: await extractTextFromExcel(buffer, file.name),
        type: docType,
      };
    }
    case 'docx': {
      return {
        content: await extractTextFromZip(
          buffer,
          file.name,
          /word\/document\.xml$/i,
          extractTextFromDocxXml
        ),
        type: docType,
      };
    }
    case 'pptx': {
      return {
        content: await extractTextFromZip(
          buffer,
          file.name,
          /ppt\/slides\/slide\d+\.xml$/i,
          extractTextFromPptxXml
        ),
        type: docType,
      };
    }
    case 'pdf': {
      return {
        content: await extractTextFromPdf(buffer, file.name),
        type: docType,
      };
    }
    case 'doc': {
      return {
        content: `[The older .doc format is not fully supported for text extraction. Please convert ${file.name} to .docx format for better results, or copy the text content manually.]`,
        type: docType,
      };
    }
    case 'ppt': {
      return {
        content: `[The older .ppt format is not fully supported for text extraction. Please convert ${file.name} to .pptx format for better results, or copy the text content manually.]`,
        type: docType,
      };
    }
    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }
}

export async function parseFiles(files: File[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];

  for (const file of files) {
    const docType = getDocumentType(file.type) || 'pdf';
    const parsed: ParsedFile = {
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      type: docType,
      size: file.size,
      content: '',
      status: 'parsing',
    };

    try {
      const result = await parseFile(file);
      parsed.content = result.content;
      parsed.status = 'complete';
    } catch (error) {
      parsed.status = 'error';
      parsed.error = error instanceof Error ? error.message : 'Failed to parse file';
    }

    results.push(parsed);
  }

  return results;
}
