'use client';

import React from 'react';
import { useTRPC } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Clock,
  RefreshCcw,
  CalendarDays,
  Play,
  Lock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trophy,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import DetailedAnswerReview from '../components/Student/QuizRenderer/DetailedAnswerReview';

interface QuizViewDetailsProps {
  lessonTypeId: number;
  classId: string;
}

export default function QuizViewDetails({ lessonTypeId, classId }: QuizViewDetailsProps) {
  const trpc = useTRPC();
  const router = useRouter();

  // 1. Fetch Data
  const { data: quiz } = useSuspenseQuery(trpc.user.getQuizPreview.queryOptions({ lessonTypeId }));

  // 2. Mutation
  const startAttemptMutation = useMutation(
    trpc.user.startQuizAttempt.mutationOptions({
      onSuccess: (data) => {
        // FIX: Removed Date.now() and state logic.
        // We simply redirect. The QuizPageView will fetch the correct server time.
        // We construct the URL relative to the current lessonTypeId path.
        router.push(`${lessonTypeId}/${quiz.id}/?attemptId=${data.attemptId}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to start quiz.');
      },
    })
  );

  // --- Logic Helpers ---
  const now = new Date();
  const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
  const endDate = quiz.endDate ? new Date(quiz.endDate) : null;

  const isNotStarted = startDate && now < startDate;
  const isEnded = endDate && now > endDate;
  const isAvailable = !isNotStarted && !isEnded;

  // Attempt Logic
  const maxAttempts = quiz.maxAttempts ?? 1;
  const attemptsUsed = quiz.attemptsUsed ?? (quiz.latestAttempt ? 1 : 0);
  const hasAttempt = !!quiz.latestAttempt;
  const hasRemainingAttempts = attemptsUsed < maxAttempts;

  // Can they click the button?
  const canStart = isAvailable && hasRemainingAttempts;

  const canSeeScore = quiz.showScoreAfterSubmission || isEnded;
  const canSeeAnswers = quiz.showCorrectAnswers || isEnded;

  const formatDate = (date: Date | string | null, fallback = 'Always') => {
    if (!date) return fallback;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleStart = () => {
    if (!canStart) {
      toast.error('You cannot start this quiz.');
      return;
    }
    startAttemptMutation.mutate({ quizId: quiz.id });
  };

  const defaultTab = hasAttempt ? 'results' : 'details';

  // --- Button Content Logic ---
  const getButtonContent = () => {
    if (startAttemptMutation.isPending) {
      return (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Starting...
        </>
      );
    }

    if (!isAvailable) {
      return (
        <>
          <Lock className="h-5 w-5 mr-2" />
          Unavailable
        </>
      );
    }

    if (!hasRemainingAttempts) {
      return (
        <>
          <Lock className="h-5 w-5 mr-2" />
          No Attempts Left
        </>
      );
    }

    if (hasAttempt) {
      return (
        <>
          <RefreshCcw className="h-5 w-5 mr-2" />
          Retake Quiz
        </>
      );
    }

    return (
      <>
        <Play className="h-5 w-5 mr-2" />
        Begin Quiz
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/class/${classId}`)}
            className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="absolute inset-0 h-64 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {quiz.name || 'Untitled Quiz'}
            </h1>
            {quiz.description && (
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Tab System */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="details">{hasAttempt ? 'Quiz Details' : 'Overview'}</TabsTrigger>
              {hasAttempt && (
                <TabsTrigger value="results">
                  <Trophy className="h-4 w-4 mr-2" />
                  My Results
                </TabsTrigger>
              )}
            </TabsList>

            {/* --- TAB 1: DETAILS --- */}
            <TabsContent value="details">
              {/* Status Alerts */}
              {isEnded && (
                <div className="flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 mb-6">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">This quiz has ended.</span>
                </div>
              )}
              {isNotStarted && (
                <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 mb-6">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">
                    Opens on {formatDate(startDate)} at {formatTime(startDate)}
                  </span>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Time Limit */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <Clock className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Time Limit
                  </h3>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {quiz.timeLimit ? `${quiz.timeLimit} Mins` : 'No Limit'}
                  </p>
                </div>

                {/* Attempts */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <RefreshCcw className="h-8 w-8 text-green-500 mb-3" />
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Attempts
                  </h3>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {attemptsUsed} / {maxAttempts}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Used</p>
                </div>

                {/* Availability */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  <CalendarDays className="h-8 w-8 text-amber-500 mb-3" />
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Due Date
                  </h3>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {endDate ? formatDate(endDate, 'Always Open') : 'Always Open'}
                  </p>
                </div>
              </div>

              {/* Rules */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Before You Begin
                </h2>
                <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>
                      Once you start, the timer (if set) will begin counting down immediately.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>Ensure you have a stable internet connection to prevent data loss.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>
                      Do not refresh the page or use the browser back button during the quiz.
                    </span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* --- TAB 2: RESULTS --- */}
            {hasAttempt && quiz.latestAttempt && (
              <TabsContent value="results">
                <div className="space-y-6">
                  {/* Score Card */}
                  <Card className="overflow-hidden border-none shadow-lg">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
                      <h3 className="text-lg font-medium opacity-90 mb-2">Your Score</h3>

                      {canSeeScore ? (
                        <>
                          <div className="text-6xl font-bold mb-2">
                            {quiz.latestAttempt.score ?? 0} / {quiz.latestAttempt.maxScore ?? 100}
                          </div>
                          <div className="text-2xl font-semibold opacity-90">
                            {quiz.latestAttempt.percentage ?? 0}%
                          </div>
                        </>
                      ) : (
                        <div className="py-6">
                          <Eye className="h-10 w-10 mx-auto mb-3 opacity-70" />
                          <p className="text-xl font-semibold">Submission Received</p>
                          <p className="opacity-80 text-sm mt-1">
                            Scores are currently hidden by the instructor.
                          </p>
                        </div>
                      )}

                      {quiz.latestAttempt.submittedAt && (
                        <div className="mt-4 text-xs opacity-70">
                          Submitted on: {new Date(quiz.latestAttempt.submittedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Detailed Breakdown */}
                  {canSeeAnswers && <DetailedAnswerReview attemptId={quiz.latestAttempt.id} />}

                  {/* Retake Button Logic */}
                  {canStart && hasAttempt && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={handleStart}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Retake Quiz
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* STICKY BOTTOM ACTION */}
      <footer className="sticky bottom-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="hidden sm:block">
            {!canStart && hasAttempt ? (
              <p className="text-sm text-red-500 font-medium">No attempts remaining</p>
            ) : (
              <p className="text-sm text-slate-500">
                {hasAttempt ? 'Want to try again?' : 'Ready to start?'}
              </p>
            )}
          </div>

          <Button
            size="lg"
            disabled={!canStart || startAttemptMutation.isPending}
            onClick={handleStart}
            className={cn(
              'w-full sm:w-auto px-12 h-12 text-base font-semibold transition-all duration-200',
              canStart
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400'
            )}
          >
            {getButtonContent()}
          </Button>
        </div>
      </footer>
    </div>
  );
}
