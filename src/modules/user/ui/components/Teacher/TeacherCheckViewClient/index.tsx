/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Loader2, Users, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssignmentSubmissionViewer } from './AssignmentSubmissionViewer';
import { QuizSubmissionViewer } from './QuizSubmissionViewer';
import { GradingSidebar } from './GradingSidebar';
import { StatusBadge } from './StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TeacherCheckSidebar } from './TeacherCheckSidebar';
import { toast } from 'sonner';

// ==========================================
// TYPES
// ==========================================

type SubmissionStatus = 'submitted' | 'graded' | 'missing' | 'late' | 'in_progress' | 'expired';

export type StudentListResult = {
  studentId: string;
  studentName: string | null;
  studentImage: string | null;
  attemptId?: number | null;
  status?: 'in_progress' | 'submitted' | 'graded' | 'expired' | null;
  score?: number | null;
  maxScore?: number | null;
  submittedAt?: string | null;
  timeSpent?: number | null;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TeacherCheckViewClient() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();

  const classId = params.classId as string;
  const lessonTypeId = Number(params.lessonTypeId);
  const activeStudentId = params.studentId as string | undefined;

  // --- 1. Fetch Data ---
  // Destructure isLoading, isError, and error explicitly
  const { data, isLoading, isError, error } = useQuery(
    trpc.user.getStudentsPerActivity.queryOptions({ lessonTypeId })
  );

  const { mutate: updateAttempt, isPending: isSavingScore } = useMutation(
    trpc.user.updateQuizAttempt.mutationOptions({
      onSuccess: () => {
        toast.success('Grade saved successfully!');
        // Refetch the student list to update the sidebar scores
        queryClient.invalidateQueries(
          trpc.user.getStudentsPerActivity.queryFilter({ lessonTypeId })
        );
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to save grade.');
      },
    })
  );

  // Derive values safely
  const students = data?.students ?? [];
  const lessonInfo = data?.lessonInfo;

  // Determine activity type from backend data, fallback to 'quiz' if undefined
  const activityType = lessonInfo?.type === 'assignment' ? 'assignment' : 'quiz';

  // Calculate current index
  const currentIndex = activeStudentId
    ? students.findIndex((s) => s.studentId === activeStudentId)
    : 0;

  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStudent = students[safeIndex];
  const studentStatus: SubmissionStatus = currentStudent?.status ?? 'missing';

  // --- Navigation ---
  const handleNavigation = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? safeIndex - 1 : safeIndex + 1;
    if (newIndex >= 0 && newIndex < students.length) {
      const newStudentId = students[newIndex].studentId;
      router.push(`/check/${classId}/${lessonTypeId}/${newStudentId}`);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    router.push(`/check/${classId}/${lessonTypeId}/${studentId}`);
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-destructive font-medium">Failed to load activity data.</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error?.message || 'An unexpected error occurred. Please try again later.'}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // --- Empty State ---
  // Check students array length, not data object length
  if (students.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Users className="h-12 w-12 text-slate-300" />
        <p className="text-muted-foreground">No students found for this activity.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-63px)] flex flex-col bg-slate-100">
      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <TeacherCheckSidebar
          currentIndex={safeIndex}
          total={students.length}
          onBack={() => router.push(`/check/${classId}`)}
        />

        {/* Student Selector (Center) */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigation('prev')}
            disabled={safeIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select value={currentStudent?.studentId} onValueChange={handleSelectStudent}>
            <SelectTrigger className="w-[240px] h-9">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {currentStudent?.studentName?.charAt(0) ?? 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{currentStudent?.studentName}</span>
                  <div className="ml-auto">
                    <StatusBadge status={studentStatus} size="sm" />
                  </div>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => {
                const sStatus = s.status ?? 'missing';
                return (
                  <SelectItem key={s.studentId} value={s.studentId}>
                    <div className="flex items-center gap-2 w-full justify-between">
                      <span>{s.studentName}</span>
                      <StatusBadge status={sStatus} size="sm" />
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigation('next')}
            disabled={safeIndex >= students.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-[100px] hidden sm:block text-right text-xs text-slate-500 font-medium">
          {safeIndex + 1} / {students.length}
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Mini Sidebar */}
        <aside className="w-12 bg-slate-50 border-r hidden xl:flex flex-col items-center py-4 gap-1">
          {students.map((s, idx) => {
            const isActive = safeIndex === idx;
            const status = s.status ?? 'missing';
            return (
              <button
                key={s.studentId}
                onClick={() => handleSelectStudent(s.studentId)}
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all',
                  isActive
                    ? 'bg-blue-600 text-white scale-110 shadow-md'
                    : status === 'missing'
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                )}
                title={s.studentName ?? undefined}
              >
                {s.studentName?.charAt(0)}
              </button>
            );
          })}
        </aside>

        {/* CENTER: Content Viewer Switch */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {studentStatus === 'missing' ? (
            <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-white">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="font-medium">No Submission</p>
              </div>
            </div>
          ) : activityType === 'quiz' ? (
            currentStudent?.attemptId ? (
              <QuizSubmissionViewer
                key={currentStudent.attemptId} // Key ensures state resets on student change
                attemptId={currentStudent.attemptId}
                studentId={currentStudent.studentId}
                lessonTypeId={lessonTypeId}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            )
          ) : (
            <AssignmentSubmissionViewer
              key={`${currentStudent?.studentId}-${lessonTypeId}`} // Better key
              lessonTypeId={lessonTypeId}
              studentId={currentStudent?.studentId}
            />
          )}
        </div>

        {/* RIGHT: Grading Sidebar */}
        <aside className="w-[360px] border-l bg-white hidden md:flex flex-col shrink-0 overflow-y-auto">
          <GradingSidebar
            key={currentStudent?.studentId}
            student={currentStudent}
            status={studentStatus}
            lessonType={activityType}
            onNext={() => handleNavigation('next')}
            isLastStudent={safeIndex >= students.length - 1}
            // Connect the mutation here
            onSaveScore={(score) => {
              if (!currentStudent?.attemptId) {
                toast.error('No attempt found for this student.');
                return;
              }
              updateAttempt({
                attemptId: currentStudent.attemptId,
                score: score,
                maxScore: currentStudent.maxScore ?? 100,
              });
            }}
            onSendMessage={(msg) => {
              console.log('Send msg', msg);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
