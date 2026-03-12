"use client";

import { useState, useEffect } from "react";
import { LessonContentViewer } from "@/components/lesson-content-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LessonLayout } from "../Student/ClassAssignment/lesson-layout";
import { LessonComments } from "../Student/ClassAssignment/lesson-comments";
import { attemptStatusEnum } from "@/db/schemas/activity-schema";

// ==========================================
// 1. TYPES & MOCK DATA
// ==========================================

type SubmissionStatus = "submitted" | "graded" | "missing";

// ==========================================
// 1. TYPES (Strictly matching your TRPC output)
// ==========================================

export type UserCommentData = {
  lessonTypeId: number;
  id: number;
  user: { name: string; image: string | null };
  createdAt: string;
  updatedAt: string;
  userId: string;
  text: string;
  privacy: "public" | "private";
}[];

// This matches the exact structure from your error message
interface TeacherLessonData {
  id: number;
  name: string | null;
  status: "draft" | "published" | "archived" | null;
  type: "quiz" | "assignment" | "handout";
  createdAt: string; // MUST BE STRING
  lessonId: string;
  markup: string | null;

  // Documents structure
  documents: {
    id: number;
    name: string | null;
    size: number | null;
    lessonTypeId: number | null;
    fileHash: string | null;
    fileKey: string;
    fileUrl: string;
    fileUfsUrl: string | null;
    fileType: string | null;
    uploadedAt: string; // MUST BE STRING
  }[];

  // Assignment Settings
  assignmentSettings: {
    maxAttempts: number | null;
    endDate: string | null; // MUST BE STRING
    scores: number | null;
    quidId: number;
  };

  // Serialized Markup
  serializedMarkup: {
    scope: Record<string, unknown>;
    compiledSource: string;
    frontmatter: Record<string, unknown>;
  };

  // Attempts (Teacher usually doesn't need this populated, but type must match)
  attempts: {
    score: number | null;
    status: (typeof attemptStatusEnum.enumValues)[number];
    attemptNumber: number;
    submittedAt: string | null;
    attemptId: number;
    documents: {
      id: number;
      name: string | null;
      size: number | null;
      fileHash: string | null;
      fileKey: string;
      fileUrl: string;
      fileUfsUrl: string | null;
      fileType: string | null;
      uploadedAt: string;
    }[];
  }[];

  // --- EXTRA DATA FOR TEACHER UI (Not in base TRPC type, but allowed) ---
  students: StudentSubmission[];
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentImage: string | null;
  status: "submitted" | "graded" | "missing";
  score: number | null;
  maxScore: number;
  feedback: string | null;
  submittedAt: string | null; // STRING
  documents: { id: string; name: string; fileUrl: string }[];
}

// ==========================================
// 2. MOCK DATA GENERATOR
// ==========================================

const generateMockData = (): TeacherLessonData => {
  return {
    id: 1,
    name: "Essay on World War II",
    status: "published",
    type: "assignment",
    createdAt: new Date().toISOString(), // Converted to string
    lessonId: "class_123",
    markup: "<p>Write a comprehensive essay discussing the causes of WWII.</p>",

    documents: [
      {
        id: 101,
        name: "Assignment_Rubric.pdf",
        fileUrl: "https://example.com/rubric.pdf",
        fileKey: "rubric_key_123",
        size: 1024,
        uploadedAt: new Date().toISOString(),
        fileHash: null,
        fileType: "pdf",
        lessonTypeId: 1,
        fileUfsUrl: null,
      },
    ],

    assignmentSettings: {
      maxAttempts: 2,
      scores: 100,
      endDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Converted to string
      quidId: 5001,
    },

    serializedMarkup: {
      compiledSource:
        '"use strict";\nconst {jsxDEV: _jsxDEV} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction _createMdxContent(props) {\n const _components = {\n p: "p",\n ..._provideComponents(),\n ...props.components\n };\n return _jsxDEV(_components.p, {\n children: "assignment"\n }, undefined, false, {\n fileName: "<source.js>",\n lineNumber: 1,\n columnNumber: 1\n }, this);\n}\nfunction MDXContent(props = {}) {\n const {wrapper: MDXLayout} = {\n ..._provideComponents(),\n ...props.components\n };\n return MDXLayout ? _jsxDEV(MDXLayout, {\n ...props,\n children: _jsxDEV(_createMdxContent, {\n ...props\n }, undefined, false, {\n fileName: "<source.js>"\n }, this)\n }, undefined, false, {\n fileName: "<source.js>"\n }, this) : _createMdxContent(props);\n}\nreturn {\n default: MDXContent\n};\n',
      scope: {},
      frontmatter: {},
    },

    attempts: [], // Teacher view doesn't need self-attempts

    // Extra Mock Data for Students
    students: [
      {
        studentId: "s1",
        studentName: "Alice Johnson",
        studentImage: null,
        status: "graded",
        score: 85,
        maxScore: 100,
        feedback: "Great work!",
        submittedAt: new Date().toISOString(),
        documents: [{ id: "d1", name: "alice_essay.pdf", fileUrl: "#" }],
      },
      {
        studentId: "s2",
        studentName: "Bob Smith",
        studentImage: null,
        status: "submitted",
        score: null,
        maxScore: 100,
        feedback: null,
        submittedAt: new Date().toISOString(),
        documents: [{ id: "d2", name: "bob_essay.docx", fileUrl: "#" }],
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
        documents: [],
      },
    ],
  };
};

const mockComments: UserCommentData = [
  {
    id: 1,
    lessonTypeId: 1,
    text: "Is there a specific font size requirement?",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "s1",
    user: { name: "Alice Johnson", image: null },
    privacy: "public",
  },
];
// ==========================================
// 2. MAIN COMPONENT
// ==========================================

interface Props {
  params: { classId: string; lessonTypeId: number };
  session: { user: { id: string } };
}

export function TeacherLessonView({ params, session }: Props) {
  const [activePrivacy, setActivePrivacy] = useState<"public" | "private">(
    "public",
  );

  const [lessonData, setLessonData] =
    useState<TeacherLessonData>(generateMockData);
  const [comments, setComments] = useState<UserCommentData>(mockComments);
  const [isPendingComment, setIsPendingComment] = useState(false);

  const upsertComment = async (text: string, privacy: "public" | "private") => {
    setIsPendingComment(true);
    await new Promise((r) => setTimeout(r, 500));

    const newComment: UserCommentData[0] = {
      id: Date.now(),
      lessonTypeId: +params.lessonTypeId,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: session.user.id,
      user: { name: "Teacher (You)", image: null },
      privacy: privacy,
    };

    setComments((prev) => [...prev, newComment]);
    setIsPendingComment(false);
    toast.success("Comment posted");
  };

  const updateGrade = (studentId: string, score: number, feedback: string) => {
    setTimeout(() => {
      setLessonData((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.studentId === studentId
            ? { ...s, score, feedback, status: "graded" }
            : s,
        ),
      }));
      toast.success("Grade saved!");
    }, 500);
  };

  const stats = {
    total: lessonData.students.length,
    submitted: lessonData.students.filter((s) => s.status !== "missing").length,
    graded: lessonData.students.filter((s) => s.status === "graded").length,
    average:
      lessonData.students.filter((s) => s.score !== null).length > 0
        ? (
            lessonData.students.reduce((acc, s) => acc + (s.score || 0), 0) /
            lessonData.students.filter((s) => s.score !== null).length
          ).toFixed(1)
        : "0",
  };

  return (
    <LessonLayout
      data={lessonData}
      sessionUser={session.user}
      viewer={<LessonContentViewer data={lessonData} />}
      actionSlot={
        <TeacherSubmissionManager
          students={lessonData.students}
          stats={stats}
          maxScore={100}
          lessonTypeId={+params.lessonTypeId}
          onUpdateGrade={updateGrade}
        />
      }
      commentsSection={
        <LessonComments
          comments={comments}
          currentUserId={session.user.id}
          isPending={isPendingComment}
          activePrivacy={activePrivacy}
          onPrivacyChange={setActivePrivacy}
          onPostComment={upsertComment}
          onEditComment={(id, text, privacy) =>
            console.log("Edit", id, text, privacy)
          }
        />
      }
    />
  );
}

// ==========================================
// 3. SUB COMPONENTS
// ==========================================

function TeacherSubmissionManager({
  students,
  stats,
  maxScore,
  onUpdateGrade,
}: {
  students: StudentSubmission[];
  stats: { total: number; submitted: number; graded: number; average: string };
  maxScore: number;
  lessonTypeId: number;
  onUpdateGrade: (studentId: string, score: number, feedback: string) => void;
}) {
  const [selectedStudent, setSelectedStudent] =
    useState<StudentSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm">Submissions</CardTitle>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" /> {students.length} Students
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded border">
              <p className="text-lg font-bold text-green-600">{stats.graded}</p>
              <p className="text-[10px] text-slate-500 uppercase">Graded</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border">
              <p className="text-lg font-bold text-amber-600">
                {stats.submitted - stats.graded}
              </p>
              <p className="text-[10px] text-slate-500 uppercase">Pending</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border">
              <p className="text-lg font-bold text-slate-700">
                {stats.average}%
              </p>
              <p className="text-[10px] text-slate-500 uppercase">Avg</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[200px] pl-4">Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.studentId} className="group">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={student.studentImage || ""} />
                          <AvatarFallback>
                            {student.studentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {student.studentName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {student.score !== null ? (
                        <span className="font-bold text-slate-700">
                          {student.score}
                          <span className="text-xs text-slate-400">
                            /{maxScore}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {student.status !== "missing" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Grade
                        </Button>
                      )}
                      {student.status === "missing" && (
                        <span className="text-xs text-slate-400 italic">
                          No submission
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedStudent && (
        <GradingDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          submission={selectedStudent}
          maxScore={maxScore}
          onSave={onUpdateGrade}
        />
      )}
    </>
  );
}

function GradingDialog({
  open,
  onOpenChange,
  submission,
  maxScore,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: StudentSubmission;
  maxScore: number;
  onSave: (studentId: string, score: number, feedback: string) => void;
}) {
  const [score, setScore] = useState("0");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setScore(submission.score?.toString() || "0");
        setFeedback(submission.feedback || "");
      });
    }
  }, [open, submission]);

  const handleSave = () => {
    setIsSaving(true);
    onSave(submission.studentId, parseInt(score) || 0, feedback);
    setTimeout(() => {
      setIsSaving(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Student:{" "}
            <span className="font-medium text-slate-700">
              {submission.studentName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-1 border rounded-md bg-slate-50 h-48 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">File Preview</p>
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Score</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-9"
                  min={0}
                  max={maxScore}
                />
                <span className="text-sm text-slate-400">/ {maxScore}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="h-[100px] resize-none"
                placeholder="Optional feedback..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save Grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({
  status,
}: {
  status: "submitted" | "graded" | "missing";
}) {
  const config = {
    submitted: {
      label: "Submitted",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    graded: {
      label: "Graded",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    missing: {
      label: "Missing",
      className: "bg-slate-100 text-slate-500 border-slate-200",
      icon: FileText,
    },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", c.className)}>
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}
