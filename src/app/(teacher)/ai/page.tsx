'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Upload,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wand2,
  FileUp,
  BookOpen,
  Lightbulb,
  FileSearch,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  getDocumentType,
  formatFileSize,
  getFileIcon,
  parseFile,
  type ParsedFile,
} from '@/lib/file-parser';

interface FileWithProgress extends ParsedFile {
  progress: number;
}

interface FileUploaderProps {
  files: FileWithProgress[];
  onFilesChange: (files: FileWithProgress[]) => void;
  onUseContent: (content: string, target: 'material' | 'lessonPlan') => void;
  contentTarget: 'material' | 'lessonPlan';
  maxFiles?: number;
}

function FileUploader({
  files,
  onFilesChange,
  onUseContent,
  contentTarget,
  maxFiles = 5,
}: FileUploaderProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        type: getDocumentType(file.type) || 'pdf',
        size: file.size,
        content: '',
        status: 'pending' as const,
        progress: 0,
      }));

      onFilesChange([...files, ...newFiles].slice(0, maxFiles));
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
    },
    maxFiles: maxFiles - files.length,
    maxSize: 50 * 1024 * 1024,
  });

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const parseAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsParsing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'pending' || updatedFiles[i].status === 'error') {
        updatedFiles[i].status = 'parsing';
        updatedFiles[i].progress = 0;
        onFilesChange([...updatedFiles]);

        try {
          for (let p = 0; p <= 80; p += 20) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            updatedFiles[i].progress = p;
            onFilesChange([...updatedFiles]);
          }

          const result = await parseFile(updatedFiles[i].file);
          updatedFiles[i].content = result.content;
          updatedFiles[i].status = 'complete';
          updatedFiles[i].progress = 100;
        } catch (error) {
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = error instanceof Error ? error.message : 'Failed to parse';
          updatedFiles[i].progress = 0;
        }
        onFilesChange([...updatedFiles]);
      }
    }

    setIsParsing(false);
    const successCount = updatedFiles.filter((f) => f.status === 'complete').length;
    toast.success(`${successCount} file(s) parsed successfully!`);
  };

  const completedCount = files.filter((f) => f.status === 'complete').length;
  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          {isDragActive ? (
            <p className="text-primary font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm font-medium">Drag & drop files or click to select</p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, PowerPoint - Max {maxFiles} files, 50MB each
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                {completedCount}/{files.length} parsed
              </Badge>
              {pendingCount > 0 && (
                <span className="text-xs text-muted-foreground">{pendingCount} pending</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={parseAllFiles}
                disabled={isParsing || pendingCount === 0}
                className="gap-1"
              >
                {isParsing ? <Spinner className="h-3 w-3" /> : <FileSearch className="h-3 w-3" />}
                Parse {pendingCount > 0 ? `(${pendingCount})` : ''}
              </Button>
              {files.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => onFilesChange([])}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.id}
                className={`p-3 rounded-lg border transition-all ${
                  f.status === 'complete'
                    ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                    : f.status === 'error'
                      ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                      : f.status === 'parsing'
                        ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900'
                        : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(f.type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === 'pending' && (
                      <Badge variant="outline" className="text-xs">
                        Ready
                      </Badge>
                    )}
                    {f.status === 'parsing' && (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-3 w-3" />
                        <span className="text-xs">{f.progress}%</span>
                      </div>
                    )}
                    {f.status === 'complete' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setExpandedFile(expandedFile === f.id ? null : f.id)}
                        >
                          {expandedFile === f.id ? 'Hide' : 'Preview'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => onUseContent(f.content, contentTarget)}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Use
                        </Button>
                      </>
                    )}
                    {f.status === 'error' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">{f.error}</span>
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeFile(f.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {f.status === 'parsing' && <Progress value={f.progress} className="mt-2 h-1" />}
                {expandedFile === f.id && f.content && (
                  <div className="mt-3 p-2 bg-background/80 rounded border text-xs max-h-32 overflow-y-auto">
                    <p className="text-muted-foreground font-medium mb-1">Extracted Content:</p>
                    <pre className="whitespace-pre-wrap break-words">
                      {f.content.substring(0, 500)}
                      {f.content.length > 500 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherAIPage() {
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [materialContent, setMaterialContent] = useState('');
  const [lessonPlanContent, setLessonPlanContent] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [materialType, setMaterialType] = useState<string>('quiz');
  const [uploadedFiles, setUploadedFiles] = useState<FileWithProgress[]>([]);
  const [uploadedFilesLesson, setUploadedFilesLesson] = useState<FileWithProgress[]>([]);
  const [activeTab, setActiveTab] = useState<string>('questions');

  const trpc = useTRPC();

  const { data: lessons, isLoading: loadingLessons } = useQuery(
    trpc.user.getTeacherLessonsForAI.queryOptions()
  );
  const selectedLessonData = lessons?.find((l) => l.lessonTypeId === Number(selectedLesson));

  const addFileContent = (content: string, target: 'material' | 'lessonPlan') => {
    if (target === 'material') {
      setMaterialContent((prev) => prev + (prev ? '\n\n---\n\n' : '') + content);
    } else {
      setLessonPlanContent((prev) => prev + (prev ? '\n\n---\n\n' : '') + content);
    }
    toast.success('Content added to editor');
  };

  const generateQuestions = useMutation(
    trpc.user.generateQuestions.mutationOptions({
      onSuccess: () => {
        toast.success('Questions are being generated...');
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const analyzeMaterial = useMutation(
    trpc.user.analyzeMaterial.mutationOptions({
      onSuccess: () => {
        toast.success('Material is being analyzed...');
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const improveLessonPlan = useMutation(
    trpc.user.improveLessonPlan.mutationOptions({
      onSuccess: () => {
        toast.success('Lesson plan is being improved...');
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const generateMaterial = useMutation(
    trpc.user.generateMaterial.mutationOptions({
      onSuccess: () => {
        toast.success('Material is being generated...');
        setTopic('');
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const handleGenerateQuestions = () => {
    if (!selectedLesson || !materialContent) {
      toast.error('Please select a lesson and enter content');
      return;
    }
    generateQuestions.mutate({
      lessonTypeId: Number(selectedLesson),
      materialContent,
      questionType: questionType as
        | 'multiple_choice'
        | 'true_false'
        | 'short_answer'
        | 'essay'
        | 'all',
      count: questionCount,
    });
  };

  const handleAnalyzeMaterial = () => {
    if (!selectedLesson || !materialContent) {
      toast.error('Please select a lesson and enter content');
      return;
    }
    analyzeMaterial.mutate({
      lessonTypeId: Number(selectedLesson),
      materialContent,
      materialType: materialType as 'quiz' | 'assignment' | 'handout' | 'module',
    });
  };

  const handleImproveLessonPlan = () => {
    if (!selectedLesson || !lessonPlanContent || !subject || !gradeLevel) {
      toast.error('Please fill in all fields');
      return;
    }
    improveLessonPlan.mutate({
      lessonTypeId: Number(selectedLesson),
      lessonPlanContent,
      subject,
      gradeLevel,
    });
  };

  const handleGenerateMaterial = () => {
    if (!selectedLesson || !topic || !subject || !gradeLevel) {
      toast.error('Please fill in all fields');
      return;
    }
    generateMaterial.mutate({
      lessonTypeId: Number(selectedLesson),
      topic,
      subject,
      gradeLevel,
      materialType: materialType as 'quiz' | 'assignment' | 'handout' | 'module',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Teaching Assistant</h1>
            <p className="text-muted-foreground">Powered by OpenRouter - DepEd Aligned</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Select Lesson</Label>
              <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lesson to attach AI results" />
                </SelectTrigger>
                <SelectContent>
                  {loadingLessons ? (
                    <div className="flex justify-center p-4">
                      <Spinner />
                    </div>
                  ) : (
                    lessons?.map((lesson) => (
                      <SelectItem key={lesson.lessonTypeId} value={lesson.lessonTypeId.toString()}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {lesson.lessonName || 'Untitled'} - {lesson.className} (
                            {lesson.lessonType})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedLessonData && (
              <Badge variant="outline" className="px-3 py-2">
                AI Results Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLessonData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedLessonData.aiGeneratedQuestions && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Generated Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg overflow-auto max-h-48">
                  {selectedLessonData.aiGeneratedQuestions}
                </pre>
              </CardContent>
            </Card>
          )}

          {selectedLessonData.aiAnalysis && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-base">Material Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg overflow-auto max-h-48">
                  {selectedLessonData.aiAnalysis}
                </pre>
              </CardContent>
            </Card>
          )}

          {selectedLessonData.aiSuggestions && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-base">Lesson Plan Suggestions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg overflow-auto max-h-48">
                  {selectedLessonData.aiSuggestions}
                </pre>
              </CardContent>
            </Card>
          )}

          {selectedLessonData.aiGeneratedMaterial && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Generated Material</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg overflow-auto max-h-48">
                  {selectedLessonData.aiGeneratedMaterial}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="analyze" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="improve" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Improve
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2">
            <FileUp className="h-4 w-4" />
            Document Analyzer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate Questions
              </CardTitle>
              <CardDescription>
                Upload files or paste content to generate assessment questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select
                    value={questionCount.toString()}
                    onValueChange={(v) => setQuestionCount(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 10, 15, 20].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FileUploader
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onUseContent={addFileContent}
                contentTarget="material"
                maxFiles={5}
              />

              <div className="space-y-2">
                <Label>Learning Material Content</Label>
                <Textarea
                  placeholder="Paste your lesson content here, or upload files above and click 'Use' to add content..."
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  rows={6}
                  className="min-h-[150px]"
                />
              </div>
              <Button
                onClick={handleGenerateQuestions}
                disabled={generateQuestions.isPending || !selectedLesson || !materialContent}
                className="w-full gap-2"
                size="lg"
              >
                {generateQuestions.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Questions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Analyze Material Quality
              </CardTitle>
              <CardDescription>
                Get AI feedback on your learning materials - quizzes, assignments, handouts, or
                modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Material Type</Label>
                <Select value={materialType} onValueChange={setMaterialType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="handout">Handout</SelectItem>
                    <SelectItem value="module">Module</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FileUploader
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onUseContent={addFileContent}
                contentTarget="material"
                maxFiles={5}
              />

              <div className="space-y-2">
                <Label>Material Content</Label>
                <Textarea
                  placeholder="Paste your quiz, assignment, or learning material content here for analysis..."
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  rows={8}
                  className="min-h-[200px]"
                />
              </div>
              <Button
                onClick={handleAnalyzeMaterial}
                disabled={analyzeMaterial.isPending || !selectedLesson || !materialContent}
                className="w-full gap-2"
                size="lg"
              >
                {analyzeMaterial.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                Analyze Material
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improve" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Improve Lesson Plan
              </CardTitle>
              <CardDescription>
                Get suggestions to enhance your lesson plan based on DepEd best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Textarea
                    placeholder="e.g., Mathematics, Science, English"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Textarea
                    placeholder="e.g., Grade 11, Grade 12"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <FileUploader
                files={uploadedFilesLesson}
                onFilesChange={setUploadedFilesLesson}
                onUseContent={addFileContent}
                contentTarget="lessonPlan"
                maxFiles={3}
              />

              <div className="space-y-2">
                <Label>Lesson Plan Content</Label>
                <Textarea
                  placeholder="Paste your current lesson plan here for AI to review and suggest improvements..."
                  value={lessonPlanContent}
                  onChange={(e) => setLessonPlanContent(e.target.value)}
                  rows={10}
                  className="min-h-[250px]"
                />
              </div>
              <Button
                onClick={handleImproveLessonPlan}
                disabled={
                  improveLessonPlan.isPending ||
                  !selectedLesson ||
                  !lessonPlanContent ||
                  !subject ||
                  !gradeLevel
                }
                className="w-full gap-2"
                size="lg"
              >
                {improveLessonPlan.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Get Suggestions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-500" />
                Generate Learning Material
              </CardTitle>
              <CardDescription>
                Create new learning materials based on DepEd curriculum standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Textarea
                    placeholder="e.g., Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Textarea
                    placeholder="e.g., Grade 12"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="handout">Handout</SelectItem>
                      <SelectItem value="module">Module</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Textarea
                  placeholder="Describe the topic you want to generate material for..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleGenerateMaterial}
                disabled={
                  generateMaterial.isPending || !selectedLesson || !topic || !subject || !gradeLevel
                }
                className="w-full gap-2"
                size="lg"
              >
                {generateMaterial.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Material
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />
                Document Analyzer
              </CardTitle>
              <CardDescription>
                Upload and analyze office documents with AI. Extract text, generate summaries,
                create quiz questions, and get insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
                  <FileText className="h-10 w-10 mb-2 text-red-500" />
                  <span className="text-sm font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">.pdf</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <FileText className="h-10 w-10 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">Word</span>
                  <span className="text-xs text-muted-foreground">.docx</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <FileSpreadsheet className="h-10 w-10 mb-2 text-green-500" />
                  <span className="text-sm font-medium">Excel</span>
                  <span className="text-xs text-muted-foreground">.xlsx</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                  <Presentation className="h-10 w-10 mb-2 text-orange-500" />
                  <span className="text-sm font-medium">PowerPoint</span>
                  <span className="text-xs text-muted-foreground">.pptx</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Features:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Extract text and metadata from uploaded documents</li>
                  <li>Generate summaries and identify key points</li>
                  <li>Create quiz questions automatically</li>
                  <li>Get suggestions for improving content</li>
                  <li>Batch process multiple documents</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = '/ai/document')}
              >
                Open Dedicated Document Analyzer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
