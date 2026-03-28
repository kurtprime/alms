'use client';

import React from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Lightbulb,
  FileText,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// ==========================================
// TYPES
// ==========================================

type QuizAnswer =
  | { type: 'option'; optionId: string }
  | { type: 'text'; text: string }
  | { type: 'multiple'; optionIds: string[] }
  | { type: 'ordering'; order: string[] }
  | { type: 'matching'; matches: { left: string | null; right: string | null }[] }
  | { type: 'boolean'; value: boolean }
  | null;

type CorrectAnswer =
  | boolean
  | { id: string; text: string }[]
  | { left: string | null; right: string }[]
  | null;

interface ReviewItem {
  questionId: number;
  questionText: string;
  type: 'multiple_choice' | 'true_false' | 'matching' | 'essay' | 'ordering';
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

export default function DetailedAnswerReview({ attemptId }: DetailedAnswerReviewProps) {
  const trpc = useTRPC();

  const {
    data: result,
    isPending,
    isError,
    error,
  } = useQuery(trpc.user.getQuizResult.queryOptions({ attemptId }));

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading review...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-8 w-8" />
        <p className="font-medium">Failed to load review</p>
        <p className="text-sm text-slate-500">{error?.message}</p>
      </div>
    );
  }

  const reviewItems = (result?.review ?? []) as ReviewItem[];

  if (reviewItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 text-center text-muted-foreground">
        No review data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Detailed Breakdown
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Correct
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Incorrect
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
          </span>
        </div>
      </div>

      <Accordion type="multiple" className="w-full space-y-3">
        {reviewItems.map((item, index) => {
          const isCorrect = item.isCorrect === true;
          const isPending = item.isCorrect === null;

          // Dynamic styling based on status
          let statusConfig = {
            icon: XCircle,
            badgeText: 'Incorrect',
            badgeClass:
              'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            borderClass: 'border-l-red-500',
            bgClass: 'hover:bg-red-50/50 dark:hover:bg-red-950/20',
          };

          if (isCorrect) {
            statusConfig = {
              icon: CheckCircle2,
              badgeText: 'Correct',
              badgeClass:
                'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
              borderClass: 'border-l-green-500',
              bgClass: 'hover:bg-green-50/50 dark:hover:bg-green-950/20',
            };
          } else if (isPending) {
            statusConfig = {
              icon: Clock,
              badgeText: 'Needs Review',
              badgeClass:
                'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
              borderClass: 'border-l-amber-500',
              bgClass: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
            };
          }

          const StatusIcon = statusConfig.icon;

          return (
            <AccordionItem
              key={item.questionId}
              value={`question-${item.questionId}`}
              className={cn(
                'border rounded-lg bg-white dark:bg-slate-900 overflow-hidden transition-all data-[state=open]:shadow-md',
                statusConfig.borderClass,
                'border-l-4'
              )}
            >
              <AccordionTrigger
                className={cn('hover:no-underline px-4 py-3 group', statusConfig.bgClass)}
              >
                <div className="flex items-center gap-3 w-full pr-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full w-8 h-8 shrink-0 transition-transform group-data-[state=open]:scale-110',
                      statusConfig.badgeClass
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Question {index + 1}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.questionText}
                    </p>
                  </div>

                  <div className="flex flex-col items-end ml-auto pl-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-mono',
                        isCorrect
                          ? 'border-green-300 text-green-700'
                          : isPending
                            ? 'border-amber-300 text-amber-700'
                            : 'border-red-300 text-red-700'
                      )}
                    >
                      {item.pointsEarned ?? 0} / {item.points} pts
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-0 pb-0">
                <Separator />

                <div className="p-4 space-y-6 bg-slate-50/50 dark:bg-slate-800/20">
                  {/* Question Text (Full) */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {item.questionText}
                    </p>
                  </div>

                  {/* Answer Comparison Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* User Answer */}
                    <div
                      className={cn(
                        'p-4 rounded-lg border',
                        isCorrect
                          ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                          : isPending
                            ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                            : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="h-4 w-4" />
                        Your Answer
                      </div>
                      <RenderUserAnswer item={item} />
                    </div>

                    {/* Correct Answer (Hide if pending essay) */}
                    {!isPending && (
                      <div className="p-4 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Correct Answer
                        </div>
                        <RenderCorrectAnswer item={item} />
                      </div>
                    )}
                  </div>

                  {/* Feedback Section */}
                  {(item.teacherFeedback || item.explanation) && (
                    <div className="space-y-3 pt-2">
                      {item.teacherFeedback && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs mb-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Teacher Feedback
                          </div>
                          <p className="text-sm text-amber-900 dark:text-amber-200">
                            {item.teacherFeedback}
                          </p>
                        </div>
                      )}
                      {item.explanation && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-xs mb-1">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Explanation
                          </div>
                          <p className="text-sm text-blue-900 dark:text-blue-200">
                            {item.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ==========================================
// RENDERERS
// ==========================================

function RenderUserAnswer({ item }: { item: ReviewItem }) {
  const ans = item.userAnswer;

  if (!ans) {
    return <span className="italic text-slate-400 text-sm">No answer provided</span>;
  }

  const findTextFromCorrect = (id: string): string | null => {
    if (item.type === 'multiple_choice' || item.type === 'ordering') {
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
    case 'multiple_choice': {
      if (ans.type === 'option') {
        const text = findTextFromCorrect(ans.optionId);
        return (
          <Badge variant="secondary" className="font-normal text-sm">
            {text ? text : `Option ID: ...${ans.optionId.slice(-4)}`}
          </Badge>
        );
      }

      if (ans.type === 'multiple') {
        if (!ans.optionIds || ans.optionIds.length === 0) {
          return <span className="italic text-slate-400 text-sm">None selected</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {ans.optionIds.map((id) => {
              const text = findTextFromCorrect(id);
              return (
                <Badge key={id} variant="secondary" className="font-normal">
                  {text ? text : `...${id.slice(-4)}`}
                </Badge>
              );
            })}
          </div>
        );
      }
      return null;
    }

    case 'true_false': {
      if (ans.type !== 'boolean') return null;
      return (
        <Badge variant={ans.value ? 'default' : 'secondary'} className="w-fit">
          {ans.value ? 'True' : 'False'}
        </Badge>
      );
    }

    case 'ordering': {
      if (ans.type !== 'ordering') return null;
      return (
        <ol className="list-decimal list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
          {ans.order.map((id, idx) => {
            const text = findTextFromCorrect(id);
            return (
              <li key={id} className="truncate">
                {text ? text : `Item ${idx + 1}`}
              </li>
            );
          })}
        </ol>
      );
    }

    case 'matching': {
      if (ans.type !== 'matching') return null;
      const pairs = ans.matches;
      if (!pairs || pairs.length === 0)
        return <span className="italic text-slate-400 text-sm">No matches made</span>;

      return (
        <div className="space-y-1.5">
          {pairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-sans font-normal">
                {pair.left ?? '???'}
              </Badge>
              <span className="text-slate-400 text-xs">→</span>
              <Badge variant="secondary" className="font-sans font-normal">
                {pair.right ?? '???'}
              </Badge>
            </div>
          ))}
        </div>
      );
    }

    case 'essay': {
      if (ans.type !== 'text') return null;
      return ans.text ? (
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{ans.text}</p>
      ) : (
        <span className="italic text-slate-400 text-sm">No answer written</span>
      );
    }

    default:
      return null;
  }
}

function RenderCorrectAnswer({ item }: { item: ReviewItem }) {
  const ans = item.correctAnswer;

  if (ans === null) {
    return <span className="italic text-slate-400 text-sm">N/A (Manual Grading)</span>;
  }

  switch (item.type) {
    case 'multiple_choice':
    case 'ordering': {
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { id: string; text: string }[];
      return (
        <div className="flex flex-wrap gap-1.5">
          {typedAns.map((opt) => (
            <Badge key={opt.id} variant="default" className="bg-green-600 hover:bg-green-700">
              {opt.text}
            </Badge>
          ))}
        </div>
      );
    }

    case 'true_false': {
      if (typeof ans !== 'boolean') return null;
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
          {ans ? 'True' : 'False'}
        </Badge>
      );
    }

    case 'matching': {
      if (!Array.isArray(ans)) return null;
      const typedAns = ans as { left: string | null; right: string }[];
      return (
        <div className="space-y-1.5">
          {typedAns.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-sans font-normal">
                {pair.left ?? 'Item'}
              </Badge>
              <span className="text-green-600 text-xs">→</span>
              <Badge className="bg-green-600 hover:bg-green-700 font-sans font-normal">
                {pair.right}
              </Badge>
            </div>
          ))}
        </div>
      );
    }

    case 'essay': {
      return <span className="italic text-slate-500 text-sm">Manual grading required.</span>;
    }

    default:
      return null;
  }
}
