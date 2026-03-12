/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Download,
  Eye,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  Clock,
  AlertCircle,
  Calendar,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// ==========================================
// 1. TYPES
// ==========================================

type SubmissionStatus = "submitted" | "graded" | "missing" | "late";

interface QuizQuestionAnswer {
  questionId: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
}

interface AssignmentFile {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  size: number;
}

interface QuizAttempt {
  id: number;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "graded";
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  passed: boolean | null;
  timeSpent: number | null;
  isLate: boolean;
  deadline: string;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentImage: string | null;
  status: SubmissionStatus;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  submittedAt: string | null;
  submittedFiles?: AssignmentFile[];
  quizAnswers?: QuizQuestionAnswer[];
  quizAttempt?: QuizAttempt;
}

interface LessonInfo {
  id: number;
  name: string;
  type: "assignment" | "quiz";
  maxScore: number;
  deadline?: string;
}

// ==========================================
// 2. FILE TYPE UTILITIES
// ==========================================

const getFileIcon = (fileType: string) => {
  const type = fileType?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type)) {
    return <FileImage className="h-5 w-5 text-purple-500" />;
  }
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(type)) {
    return <FileVideo className="h-5 w-5 text-red-500" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(type)) {
    return <FileArchive className="h-5 w-5 text-yellow-600" />;
  }
  if (["doc", "docx"].includes(type)) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(type)) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  }
  if (["ppt", "pptx"].includes(type)) {
    return <Presentation className="h-5 w-5 text-orange-500" />;
  }
  if (type === "pdf") {
    return <FileText className="h-5 w-5 text-red-600" />;
  }
  return <File className="h-5 w-5 text-slate-500" />;
};

const isPreviewable = (fileType: string) => {
  const type = fileType?.toLowerCase() || "";
  return [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "pdf",
    "mp4",
    "webm",
    "mov",
  ].includes(type);
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTimeSpent = (seconds: number | null | undefined) => {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateString;
  }
};

// ==========================================
// 3. MOCK DATA GENERATOR
// ==========================================

const generateMockData = () => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() - 1);

  const lateDeadline = new Date();
  lateDeadline.setHours(23, 59, 59);

  const students: StudentSubmission[] = [
    {
      studentId: "s1",
      studentName: "Alice Johnson",
      studentImage: null,
      status: "graded",
      score: 85,
      maxScore: 100,
      feedback: "Great work!",
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      submittedFiles: [
        {
          id: "d1",
          name: "research_paper.pdf",
          fileUrl: "#",
          fileType: "pdf",
          size: 2457600,
        },
        {
          id: "d2",
          name: "references.docx",
          fileUrl: "#",
          fileType: "docx",
          size: 1126400,
        },
      ],
      quizAnswers: [
        {
          questionId: 1,
          question: "What is 2+2?",
          studentAnswer: "4",
          correctAnswer: "4",
          isCorrect: true,
          points: 10,
          maxPoints: 10,
        },
        {
          questionId: 2,
          question: "Capital of France?",
          studentAnswer: "Paris",
          correctAnswer: "Paris",
          isCorrect: true,
          points: 10,
          maxPoints: 10,
        },
        {
          questionId: 3,
          question: "What is the square root of 144?",
          studentAnswer: "12",
          correctAnswer: "12",
          isCorrect: true,
          points: 10,
          maxPoints: 10,
        },
        {
          questionId: 4,
          question: "Who invented the telephone?",
          studentAnswer: "Thomas Edison",
          correctAnswer: "Alexander Graham Bell",
          isCorrect: false,
          points: 0,
          maxPoints: 10,
        },
      ],
      quizAttempt: {
        id: 1,
        attemptNumber: 1,
        status: "graded",
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        score: 85,
        maxScore: 100,
        percentage: 85,
        passed: true,
        timeSpent: 2700,
        isLate: false,
        deadline: deadline.toISOString(),
      },
    },
    {
      studentId: "s2",
      studentName: "Bob Smith",
      studentImage: null,
      status: "late",
      score: null,
      maxScore: 100,
      feedback: null,
      submittedAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      submittedFiles: [
        {
          id: "d4",
          name: "project_presentation.pptx",
          fileUrl: "#",
          fileType: "pptx",
          size: 52428800,
        },
        {
          id: "d5",
          name: "project_images.zip",
          fileUrl: "#",
          fileType: "zip",
          size: 104857600,
        },
      ],
      quizAnswers: [
        {
          questionId: 1,
          question: "What is 2+2?",
          studentAnswer: "5",
          correctAnswer: "4",
          isCorrect: false,
          points: 0,
          maxPoints: 10,
        },
        {
          questionId: 2,
          question: "Capital of France?",
          studentAnswer: "London",
          correctAnswer: "Paris",
          isCorrect: false,
          points: 0,
          maxPoints: 10,
        },
        {
          questionId: 3,
          question: "What is the square root of 144?",
          studentAnswer: "11",
          correctAnswer: "12",
          isCorrect: false,
          points: 0,
          maxPoints: 10,
        },
        {
          questionId: 4,
          question: "Who invented the telephone?",
          studentAnswer: "Alexander Graham Bell",
          correctAnswer: "Alexander Graham Bell",
          isCorrect: true,
          points: 10,
          maxPoints: 10,
        },
      ],
      quizAttempt: {
        id: 2,
        attemptNumber: 1,
        status: "submitted",
        startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        score: null,
        maxScore: 100,
        percentage: null,
        passed: null,
        timeSpent: 5400,
        isLate: true,
        deadline: deadline.toISOString(),
      },
    },
    {
      studentId: "s3",
      studentName: "Charlie Brown",
      studentImage: null,
      status: "missing",
      score: null,
      maxScore: 100,
      feedback: null,
      submittedAt: null,
      submittedFiles: [],
      quizAnswers: [],
      quizAttempt: undefined,
    },
    {
      studentId: "s4",
      studentName: "Diana Ross",
      studentImage: null,
      status: "submitted",
      score: null,
      maxScore: 100,
      feedback: null,
      submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      submittedFiles: [
        {
          id: "d6",
          name: "essay_draft.pdf",
          fileUrl: "#",
          fileType: "pdf",
          size: 1048576,
        },
      ],
      quizAnswers: [],
      quizAttempt: {
        id: 3,
        attemptNumber: 1,
        status: "submitted",
        startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        score: null,
        maxScore: 100,
        percentage: null,
        passed: null,
        timeSpent: 1800,
        isLate: false,
        deadline: lateDeadline.toISOString(),
      },
    },
  ];

  return {
    lessonInfo: {
      id: 1,
      name: "Midterm Exam",
      type: "quiz",
      maxScore: 100,
      deadline: deadline.toISOString(),
    } as LessonInfo,
    students,
  };
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================

interface Props {
  params: { classId: string; lessonTypeId: string };
}

export default function TeacherCheckView({ params }: Props) {
  const router = useRouter();
  const data = generateMockData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreInput, setScoreInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentStudent = data.students[currentIndex];
  const lessonType = data.lessonInfo.type;

  const [questionPoints, setQuestionPoints] = useState<Record<number, number>>(
    () => {
      if (currentStudent.quizAnswers) {
        const initialPoints: Record<number, number> = {};
        currentStudent.quizAnswers.forEach((ans) => {
          initialPoints[ans.questionId] = ans.points;
        });
        return initialPoints;
      }
      return {};
    },
  );

  const calculateTotalScore = () => {
    if (!currentStudent.quizAnswers) return 0;
    return currentStudent.quizAnswers.reduce((sum, ans) => {
      return sum + (questionPoints[ans.questionId] ?? ans.points);
    }, 0);
  };

  const totalScore = calculateTotalScore();

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    resetInputs();
  };

  const handleNext = () => {
    if (currentIndex < data.students.length - 1)
      setCurrentIndex(currentIndex + 1);
    resetInputs();
  };

  const handleSelectStudent = (studentId: string) => {
    const index = data.students.findIndex((s) => s.studentId === studentId);
    if (index !== -1) setCurrentIndex(index);
    resetInputs();
  };

  const handleQuestionPointsChange = (questionId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const question = currentStudent.quizAnswers?.find(
      (q) => q.questionId === questionId,
    );
    const maxPoints = question?.maxPoints || 10;
    const clampedValue = Math.min(numValue, maxPoints);

    setQuestionPoints((prev) => ({
      ...prev,
      [questionId]: clampedValue,
    }));
  };

  const resetInputs = () => {
    setScoreInput("");
    setFeedbackInput("");
  };

  const handleSaveGrade = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Grade saved!");
    setIsSaving(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* --- Top Navigation Bar --- */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="font-semibold text-slate-800 hidden sm:block">
            {data.lessonInfo.name}
          </h2>
          <Badge variant="outline" className="ml-2">
            {lessonType === "quiz" ? "Quiz" : "Assignment"}
          </Badge>
          {data.lessonInfo.deadline && (
            <Badge variant="secondary" className="ml-1">
              <Clock className="h-3 w-3 mr-1" />
              Due: {formatDateTime(data.lessonInfo.deadline)}
            </Badge>
          )}
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={currentStudent.studentId}
            onValueChange={handleSelectStudent}
          >
            <SelectTrigger className="w-[200px] sm:w-[280px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {currentStudent.studentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{currentStudent.studentName}</span>
                  <StatusBadge status={currentStudent.status} size="sm" />
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {data.students.map((s) => (
                <SelectItem key={s.studentId} value={s.studentId}>
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {s.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{s.studentName}</span>
                    </div>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === data.students.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-[100px] hidden sm:block text-right text-xs text-slate-500">
          {currentIndex + 1} of {data.students.length}
        </div>
      </header>

      {/* --- Main Content (Split Pane) --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Work Viewer */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentStudent.status === "missing" ? (
            <Card className="h-full flex items-center justify-center border-dashed bg-slate-100">
              <CardContent className="text-center text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No Submission</p>
                <p className="text-sm">
                  This student has not submitted work yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full shadow-sm overflow-hidden">
              <CardContent className="p-0 h-full">
                {lessonType === "assignment" ? (
                  <AssignmentViewer
                    files={currentStudent.submittedFiles || []}
                    quizAttempt={currentStudent.quizAttempt}
                  />
                ) : (
                  <QuizViewer
                    answers={currentStudent.quizAnswers || []}
                    questionPoints={questionPoints}
                    onPointsChange={handleQuestionPointsChange}
                    totalScore={totalScore}
                    maxScore={data.lessonInfo.maxScore}
                    quizAttempt={currentStudent.quizAttempt}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Grading Sidebar */}
        <aside className="w-full md:w-[380px] border-l bg-white flex flex-col shrink-0 overflow-y-auto">
          <GradingSidebar
            student={currentStudent}
            lessonInfo={data.lessonInfo}
            scoreInput={
              lessonType === "quiz" ? totalScore.toString() : scoreInput
            }
            setScoreInput={lessonType === "quiz" ? () => {} : setScoreInput}
            feedbackInput={feedbackInput}
            setFeedbackInput={setFeedbackInput}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSave={handleSaveGrade}
            isSaving={isSaving}
            lessonType={lessonType}
          />
        </aside>
      </div>
    </div>
  );
}

// ==========================================
// 5. SUB COMPONENTS
// ==========================================

function GradingSidebar({
  student,
  lessonInfo,
  scoreInput,
  setScoreInput,
  feedbackInput,
  setFeedbackInput,
  messageInput,
  setMessageInput,
  onSave,
  isSaving,
  lessonType,
}: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Section 1: Grading */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Grading</h3>
          <Badge variant="outline">Max: {lessonInfo.maxScore}</Badge>
        </div>

        {lessonType === "quiz" ? (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Total Score</p>
            <p className="text-3xl font-bold text-slate-800">{scoreInput}</p>
            <p className="text-xs text-slate-400">/ {lessonInfo.maxScore}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              className="text-lg font-bold w-24 text-center"
            />
            <span className="text-slate-400">/ {lessonInfo.maxScore}</span>
          </div>
        )}

        <Textarea
          placeholder="Add private feedback for this student..."
          value={feedbackInput}
          onChange={(e) => setFeedbackInput(e.target.value)}
          rows={4}
        />

        <Button
          className="w-full"
          onClick={onSave}
          disabled={isSaving || student.status === "missing"}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {lessonType === "quiz" ? "Save & Return Work" : "Return Work"}
        </Button>
      </div>

      {/* Section 2: Private Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-800">Private Messages</h3>
          <p className="text-xs text-slate-500">
            Only you and {student.studentName} can see this.
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
              <div className="bg-slate-100 rounded-lg p-3 text-sm max-w-[85%]">
                <p>Please check question 3 again.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Yesterday
                </span>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-500 text-white rounded-lg p-3 text-sm max-w-[85%]">
                <p>Sure! I updated my answer.</p>
                <span className="text-[10px] text-blue-200 mt-1 block">
                  10:30 AM
                </span>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{student.studentName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="relative">
            <Input
              placeholder="Send a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="pr-12"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <Send className="h-4 w-4 text-blue-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionInfo({ quizAttempt }: { quizAttempt?: QuizAttempt }) {
  if (!quizAttempt) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-3 border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-800 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Submission Details
        </h4>
        {quizAttempt.isLate && (
          <Badge variant="destructive" className="flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Late Submission
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Submitted</p>
            <p className="font-medium">
              {formatDateTime(quizAttempt.submittedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Time Spent</p>
            <p className="font-medium">
              {formatTimeSpent(quizAttempt.timeSpent)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Attempt</p>
            <p className="font-medium">#{quizAttempt.attemptNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Deadline</p>
            <p className="font-medium">
              {formatDateTime(quizAttempt.deadline)}
            </p>
          </div>
        </div>
      </div>

      {quizAttempt.isLate && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
          This submission was received after the deadline. You may want to apply
          a late penalty.
        </div>
      )}
    </div>
  );
}

function AssignmentViewer({
  files,
  quizAttempt,
}: {
  files: any[];
  quizAttempt?: QuizAttempt;
}) {
  const [selectedFile, setSelectedFile] = useState<any>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Submission Info */}
      <div className="p-4 border-b space-y-4">
        <SubmissionInfo quizAttempt={quizAttempt} />

        <div className="flex items-center justify-between">
          <h3 className="font-medium">Submitted Files ({files.length})</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="h-48 border-b">
        <div className="p-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors",
                selectedFile?.id === file.id && "border-blue-500 bg-blue-50",
              )}
              onClick={() => setSelectedFile(file)}
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.fileType)}
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPreviewable(file.fileType) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(file);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.fileUrl, "_blank");
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* File Preview Area */}
      <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
        {selectedFile ? (
          <FilePreview file={selectedFile} />
        ) : (
          <div className="text-center text-slate-400">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Select a file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: any }) {
  const type = file.fileType?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type)) {
    return (
      <div className="max-w-full max-h-full overflow-auto">
        <img
          src={file.fileUrl}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="w-full h-full max-w-4xl">
        <iframe
          src={`${file.fileUrl}#toolbar=0`}
          className="w-full h-full min-h-[500px] rounded-lg border"
          title={file.name}
        />
      </div>
    );
  }

  if (["mp4", "webm", "mov"].includes(type)) {
    return (
      <div className="w-full max-w-2xl">
        <video
          controls
          className="w-full max-h-[500px] rounded-lg"
          src={file.fileUrl}
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      {getFileIcon(type)}
      <p className="font-medium text-slate-700 mt-4">{file.name}</p>
      <p className="text-sm text-slate-500 mt-1">
        Preview not available for this file type
      </p>
      <Button className="mt-4">
        <Download className="h-4 w-4 mr-2" />
        Download File
      </Button>
    </div>
  );
}

function QuizViewer({
  answers,
  questionPoints,
  onPointsChange,
  totalScore,
  maxScore,
  quizAttempt,
}: {
  answers: QuizQuestionAnswer[];
  questionPoints: Record<number, number>;
  onPointsChange: (questionId: number, value: string) => void;
  totalScore: number;
  maxScore: number;
  quizAttempt?: QuizAttempt;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Submission Info */}
        <SubmissionInfo quizAttempt={quizAttempt} />

        {/* Total Score Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Score</p>
              <p className="text-4xl font-bold">{totalScore}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Max Points</p>
              <p className="text-2xl font-semibold">/ {maxScore}</p>
            </div>
          </div>
          <div className="mt-3 bg-blue-700 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(totalScore / maxScore) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Cards */}
        {answers.map((ans, idx) => (
          <Card
            key={idx}
            className={cn(
              "border-l-4",
              ans.isCorrect ? "border-l-green-500" : "border-l-red-500",
            )}
          >
            <CardContent className="p-4 space-y-4">
              {/* Question Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
                    {ans.question}
                  </p>
                </div>
                <Badge
                  variant={ans.isCorrect ? "default" : "destructive"}
                  className="ml-2"
                >
                  {ans.isCorrect ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {ans.isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              </div>

              {/* Answer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 border-l-2 border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    Student Answer
                  </p>
                  <p
                    className={cn(
                      "font-medium",
                      ans.isCorrect ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {ans.studentAnswer || "(No answer)"}
                  </p>
                </div>
                {!ans.isCorrect && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                      Correct Answer
                    </p>
                    <p className="text-green-600 font-medium">
                      {ans.correctAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Editable Points */}
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600">
                    Points:
                  </label>
                  <Input
                    type="number"
                    value={questionPoints[ans.questionId] ?? ans.points}
                    onChange={(e) =>
                      onPointsChange(ans.questionId, e.target.value)
                    }
                    className="w-20 h-8 text-center font-bold"
                    min={0}
                    max={ans.maxPoints}
                  />
                  <span className="text-sm text-slate-400">
                    / {ans.maxPoints}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {answers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No quiz questions to display</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function StatusBadge({
  status,
  size = "default",
}: {
  status: SubmissionStatus;
  size?: "sm" | "default";
}) {
  const config = {
    submitted: {
      label: "Submitted",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    graded: {
      label: "Graded",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    missing: {
      label: "Missing",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
    late: {
      label: "Late",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const c = config[status];

  return (
    <span
      className={cn(
        "rounded-full border font-medium",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        c.className,
      )}
    >
      {c.label}
    </span>
  );
}
