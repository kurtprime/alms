"use client";

import React from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query"; // Changed from useSuspenseQuery
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"; // Added Loader2, AlertTriangle
import { cn } from "@/lib/utils";

// ==========================================
// TYPES
// ==========================================

type QuizAnswer =
  | { type: "option"; optionId: string }
  | { type: "text"; text: string }
  | { type: "multiple"; optionIds: string[] }
  | { type: "ordering"; order: string[] }
  | {
      type: "matching";
      matches: { left: string | null; right: string | null }[];
    }
  | { type: "boolean"; value: boolean }
  | null;

type CorrectAnswer =
  | boolean
  | { id: string; text: string }[]
  | { left: string | null; right: string }[]
  | null;

interface ReviewItem {
  questionId: number;
  questionText: string;
  type: "multiple_choice" | "true_false" | "matching" | "essay" | "ordering";
  points: number;
  userAnswer: QuizAnswer;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  correctAnswer: CorrectAnswer;
  teacherFeedback: string | null;
  explanation: string | null;
}

interface DetailedAnswerReviewProps {
  attemptId: number;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DetailedAnswerReview({
  attemptId,
}: DetailedAnswerReviewProps) {
  const trpc = useTRPC();

  // Using standard useQuery to get { isPending, isError, error, data }
  const {
    data: result,
    isPending,
    isError,
    error,
  } = useQuery(trpc.user.getQuizResult.queryOptions({ attemptId }));

  // Handle Loading State
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading review...</p>
      </div>
    );
  }

  // Handle Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-8 w-8" />
        <p className="font-medium">Failed to load review</p>
        <p className="text-sm text-slate-500">{error?.message}</p>
      </div>
    );
  }

  // Handle Empty Data
  const reviewItems = (result?.review ?? []) as ReviewItem[];

  if (reviewItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 text-center text-muted-foreground">
        No review data available.
      </div>
    );
  }

  // Render Data
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Answer Review</h3>

      <Accordion type="multiple" className="w-full space-y-2">
        {reviewItems.map((item, index) => {
          const isCorrect = item.isCorrect === true;
          const isPartial = item.isCorrect === null;

          return (
            <AccordionItem
              key={item.questionId}
              value={`question-${item.questionId}`}
              className="border rounded-lg bg-white dark:bg-slate-900 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full pr-4">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full w-8 h-8 shrink-0",
                      isCorrect
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600",
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Question {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.pointsEarned ?? 0} / {item.points} pts
                    </p>
                  </div>
                  {isPartial && (
                    <Badge variant="outline" className="ml-auto mr-2">
                      Review
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-4 pb-6 space-y-6">
                {/* Question Text */}
                <div>
                  <p className="font-semibold text-sm mb-1">Question</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {item.questionText}
                  </p>
                </div>

                {/* User Answer */}
                <div>
                  <p className="font-semibold text-sm mb-1 text-blue-600">
                    Your Answer
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
                    <RenderUserAnswer item={item} />
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <p className="font-semibold text-sm mb-1 text-green-600">
                    Correct Answer
                  </p>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-sm">
                    <RenderCorrectAnswer item={item} />
                  </div>
                </div>

                {/* Feedback */}
                {(item.teacherFeedback || item.explanation) && (
                  <div className="border-t pt-4">
                    {item.teacherFeedback && (
                      <div className="mb-2">
                        <span className="font-semibold text-xs text-amber-600">
                          Teacher Feedback:
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {item.teacherFeedback}
                        </p>
                      </div>
                    )}
                    {item.explanation && (
                      <div>
                        <span className="font-semibold text-xs text-slate-500">
                          Explanation:
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ==========================================
// USER ANSWER RENDERER
// ==========================================

function RenderUserAnswer({ item }: { item: ReviewItem }) {
  const ans = item.userAnswer;

  if (!ans) {
    return <span className="italic text-slate-400">No answer provided</span>;
  }

  const findTextFromCorrect = (id: string): string | null => {
    if (item.type === "multiple_choice" || item.type === "ordering") {
      const correct = item.correctAnswer;
      if (correct && Array.isArray(correct)) {
        const items = correct as { id: string; text: string }[];
        const found = items.find((opt) => opt.id === id);
        return found?.text ?? null;
      }
    }
    return null;
  };

  switch (item.type) {
    case "multiple_choice": {
      if (ans.type !== "option") return null;
      const text = findTextFromCorrect(ans.optionId);
      return (
        <span className="font-mono text-xs">
          {text ? (
            <span className="font-medium text-slate-700">{text}</span>
          ) : (
            <span className="opacity-70">Option ID: {ans.optionId}</span>
          )}
        </span>
      );
    }

    case "true_false": {
      if (ans.type !== "boolean") return null;
      return (
        <Badge variant={ans.value ? "default" : "secondary"}>
          {ans.value ? "True" : "False"}
        </Badge>
      );
    }

    case "ordering": {
      if (ans.type !== "ordering") return null;
      return (
        <ol className="list-decimal list-inside text-xs space-y-1">
          {ans.order.map((id) => {
            const text = findTextFromCorrect(id);
            return (
              <li key={id}>
                {text ? (
                  text
                ) : (
                  <span className="opacity-70">ID: {id.slice(0, 4)}...</span>
                )}
              </li>
            );
          })}
        </ol>
      );
    }

    case "matching": {
      if (ans.type !== "matching") return null;
      return (
        <div className="space-y-2">
          {ans.matches.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="secondary" className="font-sans">
                {pair.left ?? "???"}
              </Badge>
              <span className="text-slate-400">→</span>
              <Badge variant="secondary" className="font-sans">
                {pair.right ?? "???"}
              </Badge>
            </div>
          ))}
        </div>
      );
    }

    case "essay": {
      if (ans.type !== "text") return null;
      return <p className="whitespace-pre-wrap">{ans.text}</p>;
    }

    default:
      return null;
  }
}

// ==========================================
// CORRECT ANSWER RENDERER
// ==========================================
function RenderCorrectAnswer({ item }: { item: ReviewItem }) {
  const ans = item.correctAnswer;

  if (ans === null) {
    return (
      <span className="italic text-slate-400">
        N/A (Essay or Manual Grading)
      </span>
    );
  }

  switch (item.type) {
    case "multiple_choice":
    case "ordering": {
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { id: string; text: string }[];
      return (
        <ul className="list-disc list-inside text-green-800 dark:text-green-200 space-y-1">
          {typedAns.map((opt) => (
            <li key={opt.id}>{opt.text}</li>
          ))}
        </ul>
      );
    }

    case "true_false": {
      if (typeof ans !== "boolean") return null;
      return (
        <Badge variant="outline" className="border-green-500 text-green-700">
          {ans ? "True" : "False"}
        </Badge>
      );
    }

    case "matching": {
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { left: string | null; right: string }[];
      return (
        <div className="space-y-2">
          {typedAns.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="secondary">{pair.left ?? "Item"}</Badge>
              <span className="text-green-600">→</span>
              <Badge variant="secondary">{pair.right}</Badge>
            </div>
          ))}
        </div>
      );
    }

    case "essay": {
      return <span className="italic">Manual grading required.</span>;
    }

    default:
      return null;
  }
}
