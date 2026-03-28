// src/modules/user/ui/Views/QuizPageView.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTRPC } from '@/trpc/client';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MultipleChoiceRenderer } from '../components/Student/QuizRenderer/MultipleChoiceRenderer';
import { TrueFalseRenderer } from '../components/Student/QuizRenderer/TrueFalseRenderer';
import { EssayRenderer } from '../components/Student/QuizRenderer/EssayRenderer';
import { OrderingRenderer } from '../components/Student/QuizRenderer/OrderingRenderer';
import { MatchingRenderer } from '../components/Student/QuizRenderer/MatchingRenderer';

// ============================================
// TYPES
// ============================================

import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/trpc/routers/_app';

type QuizOutput = inferRouterOutputs<AppRouter>['user']['getQuizForTaking'];
type SuccessfulQuizResponse = Extract<QuizOutput, { questions: unknown[] }>;
export type StudentQuizQuestion = NonNullable<SuccessfulQuizResponse['questions'][number]>;

type AnswerState = Record<number, unknown>;

// ============================================
// PERSISTENCE HOOK (Answers Only)
// ============================================

function useAnswerPersistence(quizId: number) {
  const storageKey = `quiz-answers-${quizId}`;

  const saveAnswers = useCallback(
    (answers: AnswerState) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
      } catch {
        // Ignore quota errors
      }
    },
    [storageKey]
  );

  const loadAnswers = useCallback((): AnswerState => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  const clearAnswers = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  return { saveAnswers, loadAnswers, clearAnswers };
}

// ============================================
// COMPONENT
// ============================================

export default function QuizPageView({
  quizId,
  lessonTypeId,
}: {
  quizId: number;
  lessonTypeId: number;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const { saveAnswers, loadAnswers, clearAnswers } = useAnswerPersistence(quizId);

  // 1. Fetch Data
  const { data: quiz } = useSuspenseQuery(trpc.user.getQuizForTaking.queryOptions({ quizId }));

  // 2. Derive Timer Values from Server Data
  const serverStartTime = quiz.attempt?.startedAt
    ? new Date(quiz.attempt.startedAt).getTime()
    : null;

  const endTime =
    serverStartTime && quiz.timeLimit ? serverStartTime + quiz.timeLimit * 60 * 1000 : null;

  // 3. Initialize State
  const [answers, setAnswers] = useState<AnswerState>(() => loadAnswers());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Time Left immediately based on server time
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!endTime) return null;
    const remaining = endTime - Date.now();
    return Math.max(0, remaining);
  });

  const questions = (quiz.questions || []) as StudentQuizQuestion[];
  const currentQuestion = questions[currentIndex];

  // 4. Mutations
  const { mutate } = useMutation(
    trpc.user.submitQuiz.mutationOptions({
      onSuccess: () => {
        clearAnswers();
        toast.success('Quiz Submitted!');
        router.push(`/class/${classId}/quiz/${lessonTypeId}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to submit quiz.');
        setIsSubmitting(false);
      },
    })
  );

  // ==========================================
  // HANDLERS
  // ==========================================

  const formatTime = (ms: number) => {
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // FIX: Wrap isAnswered in useCallback to stabilize it
  const isAnswered = useCallback(
    (qId: number) => {
      const val = answers[qId];
      if (val === undefined || val === '' || val === null) return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    },
    [answers]
  );

  const handleSubmit = useCallback(
    async (force = false) => {
      if (!force) {
        const unanswered = questions.filter((q) => !isAnswered(q.id));
        if (unanswered.length > 0) {
          if (!confirm(`You have ${unanswered.length} unanswered questions. Submit anyway?`)) {
            return;
          }
        }
      }

      setIsSubmitting(true);

      const spent = quiz.timeLimit ? quiz.timeLimit * 60 - Math.floor((timeLeft || 0) / 1000) : 0;

      mutate({
        quizId,
        attemptId: quiz.attempt?.id,
        answers: Object.entries(answers).map(([id, val]) => ({
          questionId: Number(id),
          answer: val,
        })),
        timeSpent: spent,
      });
    },
    [questions, answers, quizId, quiz.timeLimit, quiz.attempt, timeLeft, mutate, isAnswered]
  );

  // FIX: Ref for handleSubmit to use in Interval
  // We update the ref during render (safe for refs) instead of inside useEffect
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const handleAnswerChange = (qId: number, val: unknown) =>
    setAnswers((p) => ({ ...p, [qId]: val }));
  const handleNext = () => setCurrentIndex((p) => Math.min(p + 1, questions.length - 1));
  const handlePrev = () => setCurrentIndex((p) => Math.max(p - 1, 0));

  // ==========================================
  // EFFECTS
  // ==========================================

  // A. Persist Answers to LocalStorage
  useEffect(() => {
    saveAnswers(answers);
  }, [answers, saveAnswers]);

  // B. Timer Tick
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const remaining = endTime! - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        toast.error('Time is up! Submitting quiz...');
        // Use the ref to get the latest handler
        handleSubmitRef.current(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, endTime]); // handleSubmit is NOT a dependency here, preventing the reset loop

  // ==========================================
  // RENDER
  // ==========================================

  // Handle No Active Attempt (Redirect or Error)
  if (!quiz.attempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No Active Attempt</h2>
          <p className="text-muted-foreground mb-4">Please start the quiz first.</p>
          <Button onClick={() => router.push(`/class/${classId}/quiz/${lessonTypeId}`)}>
            Go to Quiz Details
          </Button>
        </div>
      </div>
    );
  }

  if (timeLeft !== null && timeLeft <= 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Time Expired</h2>
          <p className="text-muted-foreground mb-4">Your quiz time has expired.</p>
          <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Now
          </Button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No Questions Found</h2>
          <p className="text-muted-foreground">This quiz hasn&apos;t been set up yet.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-100 dark:bg-slate-950">
      {/* SIDEBAR */}
      <aside className="w-80 border-r bg-white dark:bg-slate-900 hidden md:flex flex-col">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-800">
          <h2 className="font-bold text-lg truncate">{quiz.name}</h2>
          {timeLeft !== null && (
            <div className="flex items-center gap-2 mt-2 text-lg font-mono font-bold text-blue-600">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <Button
                key={q.id}
                variant="outline"
                size="icon"
                className={cn(
                  'h-10 w-10 relative',
                  currentIndex === idx && 'border-blue-500 ring-2 ring-blue-200',
                  isAnswered(q.id) &&
                    'bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-300'
                )}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Answered: {Object.keys(answers).length}
            </span>
            <span className="text-muted-foreground">
              Remaining: {questions.length - Object.keys(answers).length}
            </span>
          </div>
          <Button className="w-full h-11" onClick={() => handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Quiz
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between">
          <h2 className="font-bold truncate">{quiz.name}</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                {Object.keys(answers).length} / {questions.length}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Questions</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {questions.map((q, idx) => (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="icon"
                    className={cn('h-10 w-10', isAnswered(q.id) && 'bg-green-100 border-green-400')}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>
              <Button className="w-full mt-6" onClick={() => handleSubmit()}>
                Submit
              </Button>
            </SheetContent>
          </Sheet>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-2">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <div className="flex items-start gap-3 mt-2">
                <span className="text-xs font-bold text-slate-400 mt-1">
                  {currentQuestion.points} pts
                </span>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                  {currentQuestion.question}
                </h1>
              </div>
            </div>

            {/* RENDERER SWITCH */}
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0">
                {currentQuestion.type === 'multiple_choice' && (
                  <MultipleChoiceRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string | string[] | undefined}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'true_false' && (
                  <TrueFalseRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as boolean | undefined}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'essay' && (
                  <EssayRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string | undefined}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'ordering' && (
                  <OrderingRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string[] | undefined}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
                {currentQuestion.type === 'matching' && (
                  <MatchingRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as Record<string, string> | undefined}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Bottom Navigation Bar */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => handleSubmit()} className="bg-green-600 hover:bg-green-700">
                <Flag className="h-4 w-4 mr-2" />
                Finish Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
