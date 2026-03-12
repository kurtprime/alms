"use client";

import React from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// TYPES (derived from your backend)
// ==========================================

type QuizAnswer =
  | { type: "option"; optionId: string }
  | { type: "text"; text: string }
  | { type: "multiple"; optionIds: string[] }
  | { type: "ordering"; order: string[] }
  | { type: "matching"; matches: Record<string, string> }
  | { type: "boolean"; value: boolean }
  | null;

type CorrectAnswer =
  | boolean // true_false
  | { id: string; text: string }[] // multiple_choice, ordering
  | { left: string | null; right: string }[] // matching
  | null; // essay

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

  const { data: result } = useSuspenseQuery(
    trpc.user.getQuizResult.queryOptions({ attemptId }),
  );

  const reviewItems = (result.review ?? []) as ReviewItem[];

  if (reviewItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 text-center text-muted-foreground">
        No review data available.
      </div>
    );
  }

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
// USER ANSWER RENDERER (strictly typed)
// ==========================================

function RenderUserAnswer({ item }: { item: ReviewItem }) {
  const ans = item.userAnswer;

  if (!ans) {
    return <span className="italic text-slate-400">No answer provided</span>;
  }

  // Helper to find text from correctAnswer list (only for multiple_choice/ordering)
  const findTextFromCorrect = (id: string): string | null => {
    if (item.type === "multiple_choice" || item.type === "ordering") {
      const correct = item.correctAnswer;
      if (Array.isArray(correct)) {
        // At this point, correct is an array of {id, text} because we know the type
        const found = correct.find((opt) => opt.id === id);
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
            <span>
              <span className="font-medium">Selected:</span> {text}
            </span>
          ) : (
            <span>Option ID: {ans.optionId}</span>
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
        <ol className="list-decimal list-inside text-xs font-mono">
          {ans.order.map((id, i) => {
            const text = findTextFromCorrect(id);
            return (
              <li key={id}>
                {text ? (
                  <span>
                    {i + 1}. {text}
                  </span>
                ) : (
                  <span>
                    Item {i + 1} (ID: {id.slice(0, 4)}...)
                  </span>
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
        <ul className="space-y-1 text-xs font-mono">
          {Object.entries(ans.matches).map(([leftId, rightId]) => (
            <li key={leftId} className="flex gap-2">
              <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">
                {leftId.slice(0, 4)}...
              </span>
              <span>→</span>
              <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">
                {rightId.slice(0, 4)}...
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "essay": {
      if (ans.type !== "text") return null;
      return <p className="whitespace-pre-wrap">{ans.text}</p>;
    }

    default:
      // Exhaustive check – if TypeScript errors, a new case needs handling
      const _exhaustiveCheck = item;
      return null;
  }
}

// ==========================================
// CORRECT ANSWER RENDERER (strictly typed)
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
      // For these types, correctAnswer is always an array of {id, text}
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { id: string; text: string }[]; // safe assertion
      return (
        <ul className="list-disc list-inside text-green-800 dark:text-green-200">
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
      // For matching, correctAnswer is an array of {left, right}
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { left: string | null; right: string }[];
      return (
        <div className="space-y-1">
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
      const _exhaustiveCheck = item;
      return _exhaustiveCheck;
  }
}
