'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Eye,
  FileImage,
  FileArchive,
  Loader2,
  AlertCircle,
  FileWarning,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import '@cyntler/react-doc-viewer/dist/index.css';

// ==========================================
// PROPS & TYPES
// ==========================================

interface Props {
  lessonTypeId: number;
  studentId: string;
}

// Helper to format bytes into readable string
const formatBytes = (bytes: number | null | undefined, decimals = 1) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to determine icon based on MIME type
const getIcon = (type: string | null) => {
  if (!type) return <FileText className="h-4 w-4 text-slate-400" />;
  if (type.includes('image')) return <FileImage className="h-4 w-4 text-purple-500" />;
  if (type.includes('zip') || type.includes('compressed'))
    return <FileArchive className="h-4 w-4 text-yellow-600" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  return <FileText className="h-4 w-4 text-blue-500" />;
};

// ==========================================
// COMPONENT
// ==========================================

export function AssignmentSubmissionViewer({ lessonTypeId, studentId }: Props) {
  const trpc = useTRPC();

  // State for the currently selected file to view
  const [selectedFile, setSelectedFile] = useState<{
    id: number;
    name: string | null;
    url: string;
    type: string | null;
    size: number | null;
  } | null>(null);

  // --- Fetch Data ---
  const {
    data: files,
    isLoading,
    isError,
  } = useQuery(trpc.user.getStudentAssignmentFiles.queryOptions({ lessonTypeId, studentId }));

  // --- Render States ---

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b bg-slate-50/50">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <div className="flex-1 flex">
          <div className="w-64 border-r p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-destructive border-dashed">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p className="font-medium">Failed to load files</p>
      </Card>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-muted-foreground border-dashed">
        <FileWarning className="h-12 w-12 mb-4 opacity-30" />
        <p className="font-medium">No Files Submitted</p>
        <p className="text-xs mt-1">The student did not attach any files.</p>
      </Card>
    );
  }

  // --- Success View ---

  // Prepare document object for the viewer
  // DocViewer expects an array, so we wrap the single selected file
  const docs = selectedFile
    ? [
        {
          uri: selectedFile.url,
          fileName: selectedFile.name || 'Document',
          fileType: selectedFile.type || undefined,
        },
      ]
    : [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-row items-center justify-between bg-slate-50/50 py-3">
        <h3 className="font-semibold text-lg">Submitted Files</h3>
        {/* Optional: Add Zip Download logic here if backend supports it */}
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" /> Download All
        </Button>
      </CardHeader>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: File List */}
        <ScrollArea className="w-64 border-r bg-slate-50">
          <div className="p-2 space-y-1">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={cn(
                  'w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors border',
                  selectedFile?.id === file.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'hover:bg-white border-transparent'
                )}
              >
                {getIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-700">
                    {file.name || 'Untitled File'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* RIGHT: Preview Area (Embedded DocViewer) */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 relative">
          {selectedFile ? (
            <div className="absolute inset-0 flex flex-col">
              {/* Optional: Custom Toolbar if you want to keep actions visible */}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="bg-white shadow-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>

              {/* The actual viewer */}
              <DocViewer
                key={selectedFile.id} // Re-render when file changes
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: {
                    disableHeader: true, // We use our own toolbar/actions
                    disableFileName: true,
                  },
                  pdfVerticalScrollByDefault: true,
                }}
                className="w-full h-full"
                style={{ height: '100%', width: '100%', backgroundColor: '#f1f5f9' }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center max-w-lg p-8 border-dashed">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Preview Files Instantly</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select a file from the list to view it directly in your browser.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Styles for DocViewer Polish */}
      <style jsx global>{`
        /* Ensure the viewer fills the container */
        #react-doc-viewer {
          height: 100% !important;
          width: 100% !important;
          overflow: auto;
          background: transparent !important;
        }

        /* Center PDF pages */
        #react-doc-viewer #proxy-renderer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 1rem;
          padding-bottom: 1rem;
          background: transparent !important;
        }

        /* Style individual PDF pages */
        #react-doc-viewer .react-pdf__Page {
          box-shadow:
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          margin-bottom: 1rem !important;
          background: white !important;
          border-radius: 4px;
        }

        /* Image styling */
        #react-doc-viewer img {
          max-height: 80vh;
          width: auto;
          object-fit: contain;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        /* Hide default file name display */
        #react-doc-viewer .file-name {
          display: none;
        }
      `}</style>
    </Card>
  );
}
