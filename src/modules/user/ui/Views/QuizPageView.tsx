// src/modules/user/ui/Views/QuizPageView.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MultipleChoiceRenderer } from "../components/Student/QuizRenderer/MultipleChoiceRenderer";
import { TrueFalseRenderer } from "../components/Student/QuizRenderer/TrueFalseRenderer";
import { EssayRenderer } from "../components/Student/QuizRenderer/EssayRenderer";
import { OrderingRenderer } from "../components/Student/QuizRenderer/OrderingRenderer";
import { MatchingRenderer } from "../components/Student/QuizRenderer/MatchingRenderer";

// ============================================
// TYPES
// ============================================

import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

type QuizOutput = inferRouterOutputs<AppRouter>["user"]["getQuizForTaking"];
type SuccessfulQuizResponse = Extract<QuizOutput, { questions: unknown[] }>;
export type StudentQuizQuestion = NonNullable<
  SuccessfulQuizResponse["questions"][number]
>;

type AnswerState = Record<number, unknown>;

// ============================================
// PERSISTENCE HOOK
// ============================================

function useQuizPersistence(quizId: number) {
  const storageKey = `quiz-attempt-${quizId}`;

  const saveState = useCallback(
    (state: { answers: AnswerState; startTime: number }) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    },
    [storageKey],
  );

  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as {
          answers: AnswerState;
          startTime: number;
        };
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, [storageKey]);

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  return { saveState, loadState, clearState };
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
  const { saveState, loadState, clearState } = useQuizPersistence(quizId);
  const params = useParams();
  const attemptIdFromUrl = params.attemptId
    ? Number(params.attemptId)
    : undefined;
  const classId = params.classId as string;
  // 1. Fetch Data
  const { data: quiz } = useSuspenseQuery(
    trpc.user.getQuizForTaking.queryOptions({ quizId }),
  );

  // Destructure mutate directly for stable reference
  const { mutate } = useMutation(
    trpc.user.submitQuiz.mutationOptions({
      onSuccess: (data) => {
        clearState(); // Clear localStorage
        toast.success("Quiz Submitted!");
        // Redirect to results page
        router.push(`/class/${classId}/quiz/${lessonTypeId}`);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit quiz.");
        setIsSubmitting(false);
      },
    }),
  );

  // 2. Load Saved Data (Synchronously)
  const savedState = loadState();

  // 3. Initialize State
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize Answers from LocalStorage
  const [answers, setAnswers] = useState<AnswerState>(
    savedState?.answers || {},
  );

  // Initialize Start Time from LocalStorage (Critical for Timer)
  const [startTime] = useState<number>(
    () => savedState?.startTime || Date.now(),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate Time Left based on Start Time and Current Time
  const calculateRemainingTime = useCallback(() => {
    if (!quiz.timeLimit) return null;

    const endTime = startTime + quiz.timeLimit * 60 * 1000;
    const remaining = endTime - Date.now();

    return Math.max(0, remaining);
  }, [quiz.timeLimit, startTime]);

  const [timeLeft, setTimeLeft] = useState<number | null>(
    calculateRemainingTime,
  );

  const questions = (quiz.questions || []) as StudentQuizQuestion[];
  const currentQuestion = questions[currentIndex];

  // ==========================================
  // PERSISTENCE EFFECT
  // ==========================================

  // Save state whenever answers or startTime changes
  useEffect(() => {
    // Don't save if we are just starting and have no answers
    if (Object.keys(answers).length === 0 && !savedState?.startTime) return;

    saveState({ answers, startTime });
  }, [answers, startTime, saveState]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const formatTime = useCallback((ms: number) => {
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const isAnswered = useCallback(
    (qId: number) => {
      return (
        answers[qId] !== undefined &&
        answers[qId] !== "" &&
        answers[qId] !== null
      );
    },
    [answers],
  );

  // FIXED: Use 'mutate' directly instead of 'submitMutation.mutate'
  const handleSubmit = useCallback(
    async (force = false) => {
      if (!force) {
        const unanswered = questions.filter((q) => !answers[q.id]);
        if (unanswered.length > 0) {
          if (
            !confirm(
              `You have ${unanswered.length} unanswered questions. Submit anyway?`,
            )
          ) {
            return;
          }
        }
      }

      setIsSubmitting(true);

      const spent = quiz.timeLimit
        ? quiz.timeLimit * 60 - Math.floor((timeLeft || 0) / 1000)
        : 0;

      // FIXED: Use 'mutate' directly
      mutate({
        quizId,
        attemptId: attemptIdFromUrl || undefined,
        answers: Object.entries(answers).map(([id, val]) => ({
          questionId: Number(id),
          answer: val,
        })),
        timeSpent: spent,
      });
    },
    [
      questions,
      answers,
      quizId,
      timeLeft,
      quiz.timeLimit,
      mutate, // FIXED: 'mutate' is stable
      attemptIdFromUrl,
      setIsSubmitting,
    ],
  );

  // Ref for handleSubmit to avoid useEffect dependency issues
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const handleAnswerChange = useCallback(
    (questionId: number, value: unknown) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [setAnswers],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }, [setCurrentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [setCurrentIndex]);

  // ==========================================
  // TIMER EFFECT
  // ==========================================

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      // Calculate fresh remaining time to prevent drift
      if (!quiz.timeLimit) return;

      const endTime = startTime + quiz.timeLimit * 60 * 1000;
      const remaining = endTime - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        toast.error("Time is up! Submitting quiz...");
        handleSubmitRef.current(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, startTime, quiz.timeLimit]);

  // ==========================================
  // RENDER
  // ==========================================

  // Check if time expired (handle case where user refreshes on expired tab)
  if (timeLeft !== null && timeLeft <= 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Time Expired</h2>
          <p className="text-muted-foreground mb-4">
            Your quiz time has expired.
          </p>
          <Button onClick={() => handleSubmit(true)}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
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
          <p className="text-muted-foreground">
            This quiz hasn&apos;t been set up yet.
          </p>
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
                  "h-10 w-10 relative",
                  currentIndex === idx &&
                    "border-blue-500 ring-2 ring-blue-200",
                  isAnswered(q.id) &&
                    "bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-300",
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
              <CheckCircle2 className="h-4 w-4" /> Answered:{" "}
              {Object.keys(answers).length}
            </span>
            <span className="text-muted-foreground">
              Remaining: {questions.length - Object.keys(answers).length}
            </span>
          </div>
          <Button
            className="w-full h-11"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
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
                    className={cn(
                      "h-10 w-10",
                      isAnswered(q.id) && "bg-green-100 border-green-400",
                    )}
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
                {currentQuestion.type === "multiple_choice" && (
                  <MultipleChoiceRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string | undefined}
                    onChange={(val) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                  />
                )}
                {currentQuestion.type === "true_false" && (
                  <TrueFalseRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as boolean | undefined}
                    onChange={(val) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                  />
                )}
                {currentQuestion.type === "essay" && (
                  <EssayRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string | undefined}
                    onChange={(val) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                  />
                )}
                {currentQuestion.type === "ordering" && (
                  <OrderingRenderer
                    data={currentQuestion}
                    value={answers[currentQuestion.id] as string[] | undefined}
                    onChange={(val) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                  />
                )}
                {currentQuestion.type === "matching" && (
                  <MatchingRenderer
                    data={currentQuestion}
                    value={
                      answers[currentQuestion.id] as
                        | Record<string, string>
                        | undefined
                    }
                    onChange={(val) =>
                      handleAnswerChange(currentQuestion.id, val)
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Bottom Navigation Bar */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit()}
                className="bg-green-600 hover:bg-green-700"
              >
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
