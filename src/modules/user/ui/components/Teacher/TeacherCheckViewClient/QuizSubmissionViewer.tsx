'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  FileWarning,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ==========================================
// 1. TYPES
// ==========================================

type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'essay' | 'ordering';

interface BaseQuestion {
  questionId: number;
  questionText: string;
  type: QuestionType;
  points: number;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  teacherFeedback: string | null;
  explanation: string | null;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  userAnswer: { type: 'option'; optionId: string };
  correctAnswer: { id: string; text: string }[];
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  userAnswer: { type: 'boolean'; value: boolean };
  correctAnswer: boolean;
}

interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  userAnswer: { type: 'matching'; matches: { left: string | null; right: string | null }[] };
  correctAnswer: { left: string | null; right: string }[];
}

interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  userAnswer: { type: 'text'; text: string };
  correctAnswer: null;
}

interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  userAnswer: { type: 'ordering'; order: string[] };
  correctAnswer: { id: string; text: string }[];
}

type ReviewQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | EssayQuestion
  | OrderingQuestion;

// ==========================================
// 2. MAIN COMPONENT (Wrapper)
// ==========================================

interface Props {
  attemptId: number;
  studentId: string;
  lessonTypeId: number;
}

export function QuizSubmissionViewer({ attemptId, studentId, lessonTypeId }: Props) {
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery(
    trpc.user.getQuizResult.queryOptions({
      attemptId,
      studentId,
    })
  );

  // --- DATA PREP ---
  const questions = useMemo(() => {
    const raw = data?.review ?? [];
    return raw.map((item) => ({
      ...item,
      type: item.type as QuestionType,
    })) as ReviewQuestion[];
  }, [data]);

  // --- RENDER STATES ---

  if (isLoading) {
    return <QuizSubmissionSkeleton />;
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Failed to load submission</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4 text-sm">
              {error.message || 'An unexpected error occurred while fetching the quiz results.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <FileWarning className="h-12 w-12 mb-4 opacity-20" />
        <p className="font-medium">No Review Data</p>
        <p className="text-xs mt-1">This quiz might not have questions or data is unavailable.</p>
      </div>
    );
  }

  // --- RENDER SUCCESS ---
  // KEY PROP FIX: We pass 'attemptId' as the key.
  // This ensures that when the teacher switches students, the inner component
  // is completely recreated, resetting the 'editedScores' state automatically
  // without needing useEffect.
  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <QuizSubmissionContent
        key={attemptId}
        questions={questions}
        attemptId={attemptId}
        lessonTypeId={lessonTypeId}
      />
    </Card>
  );
}

// ==========================================
// 3. CONTENT COMPONENT (Has its own state)
// ==========================================

interface ContentProps {
  questions: ReviewQuestion[];
  attemptId: number;
  lessonTypeId: number;
}

function QuizSubmissionContent({ questions, attemptId, lessonTypeId }: ContentProps) {
  // Initialize state directly from props.
  // Because of the 'key' prop in parent, this runs on every new attempt.
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: mutateScore, isPending } = useMutation(
    trpc.user.updateScoreOfQuizResponse.mutationOptions({
      onSuccess: () => {
        toast.success('update success');
        queryClient.invalidateQueries(
          trpc.user.getStudentsPerActivity.queryOptions({ lessonTypeId })
        );
      },
      onError: (e) => {
        toast.error(e.message);
      },
    })
  );

  const [editedScores, setEditedScores] = useState<Record<number, number>>(() => {
    const initialScores: Record<number, number> = {};
    questions.forEach((q) => {
      initialScores[q.questionId] = q.pointsEarned ?? 0;
    });
    return initialScores;
  });

  const stats = useMemo(() => {
    const totalPoints = questions.reduce((acc, q) => acc + q.points, 0);
    const earnedPoints = questions.reduce((acc, q) => acc + (editedScores[q.questionId] ?? 0), 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return { totalPoints, earnedPoints, percentage };
  }, [questions, editedScores]);

  // --- HANDLERS ---

  const handleScoreChange = (questionId: number, value: string) => {
    const num = parseInt(value, 10);
    setEditedScores((prev) => ({
      ...prev,
      [questionId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveScore = (questionId: number) => {
    const newScore = editedScores[questionId];
    const question = questions.find((q) => q.questionId === questionId);
    if (!question) return;
    mutateScore({
      questionId: questionId,
      score: newScore,
      maxScore: question.points,
      attemptId: attemptId,
    });
    console.log('Update Score Clickedss', {
      questionId: questionId,
      newScore: newScore,
      maxPoints: question?.points,
      attemptId: attemptId,
    });
  };

  return (
    <>
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl p-6 text-white mb-4 border border-b-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Score</p>
            <p className="text-4xl font-bold">
              {stats.earnedPoints}{' '}
              <span className="text-xl font-normal opacity-80">/ {stats.totalPoints}</span>
            </p>
          </div>
          <div className="text-right">
            <Badge
              variant="secondary"
              className="text-lg px-3 py-1 bg-white/20 text-white border-0"
            >
              {stats.percentage}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable Questions */}
      <ScrollArea className="flex-1 px-1 pb-4">
        <div className="space-y-4 pr-4">
          {questions.map((q, index) => (
            <QuestionCard
              key={q.questionId}
              question={q}
              isPending={isPending}
              index={index + 1}
              currentScore={editedScores[q.questionId] ?? 0}
              onScoreChange={(val) => handleScoreChange(q.questionId, val)}
              onSave={() => handleSaveScore(q.questionId)}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

// ==========================================
// 4. SKELETON COMPONENT
// ==========================================

function QuizSubmissionSkeleton() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl p-6 text-white opacity-70">
        <Skeleton className="h-4 w-24 bg-white/30 mb-2" />
        <Skeleton className="h-10 w-32 bg-white/30" />
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4 pr-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ==========================================
// 5. QUESTION CARD RENDERER
// ==========================================

interface QuestionCardProps {
  question: ReviewQuestion;
  index: number;
  currentScore: number;
  onScoreChange: (value: string) => void;
  onSave: () => void;
  isPending: boolean;
}

function QuestionCard({
  question,
  index,
  currentScore,
  onScoreChange,
  onSave,
  isPending,
}: QuestionCardProps) {
  const isCorrect = question.isCorrect === true;

  const borderClass = isPending
    ? 'border-amber-300 bg-amber-50/30'
    : isCorrect
      ? 'border-green-300 bg-green-50/30'
      : 'border-red-300 bg-red-50/30';

  return (
    <Card className={cn('border-l-4 rounded-lg transition-all', borderClass)}>
      <CardContent className="p-5 space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                isPending
                  ? 'bg-amber-200 text-amber-700'
                  : isCorrect
                    ? 'bg-green-200 text-green-700'
                    : 'bg-red-200 text-red-700'
              )}
            >
              {index}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {question.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">{question.points} pts</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                {question.questionText}
              </p>
            </div>
          </div>

          {/* Status Icon */}
          <div className="shrink-0">
            {isPending ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Answer Area */}
        <div className="pl-11 space-y-3">
          <AnswerDisplay question={question} />
        </div>

        {/* Grading Area */}
        <div className="pl-11 pt-3 border-t border-dashed flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Score:</label>
            <Input
              type="number"
              value={currentScore}
              onChange={(e) => onScoreChange(e.target.value)}
              className="w-16 h-8 text-center font-bold text-sm"
              min={0}
              max={question.points}
            />
            <span className="text-xs text-slate-400">/ {question.points}</span>
          </div>

          <Button
            disabled={isPending}
            size="sm"
            variant="outline"
            onClick={onSave}
            className="h-8 text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 6. ANSWER DISPLAY LOGIC
// ==========================================

function AnswerDisplay({ question }: { question: ReviewQuestion }) {
  switch (question.type) {
    case 'multiple_choice':
      return <MCAnswer q={question} />;
    case 'true_false':
      return <TFAnswer q={question} />;
    case 'matching':
      return <MatchingAnswer q={question} />;
    case 'ordering':
      return <OrderingAnswer q={question} />;
    case 'essay':
      return <EssayAnswer q={question} />;
    default:
      return null;
  }
}

// --- Renderers ---

function MCAnswer({ q }: { q: MultipleChoiceQuestion }) {
  const userOption = q.correctAnswer.find((o) => o.id === q.userAnswer.optionId);
  const isWrong = !q.isCorrect;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'p-3 rounded-md border',
          isWrong ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
        )}
      >
        <p className="text-xs text-muted-foreground mb-1">Student Answer</p>
        <p className={cn('font-medium', isWrong && 'text-red-700 line-through')}>
          {userOption?.text ?? <span className="text-slate-400 italic">Unknown Option</span>}
        </p>
      </div>
      {isWrong && (
        <div className="p-3 rounded-md border bg-green-50 border-green-200">
          <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
          <p className="font-medium text-green-700">{q.correctAnswer[0]?.text}</p>
        </div>
      )}
    </div>
  );
}

function TFAnswer({ q }: { q: TrueFalseQuestion }) {
  const isWrong = !q.isCorrect;
  return (
    <div className="flex gap-4">
      <div
        className={cn(
          'p-3 rounded-md border flex-1',
          isWrong && q.userAnswer.value ? 'bg-red-50 border-red-200' : 'bg-slate-50'
        )}
      >
        <p className="text-xs text-muted-foreground">Student Choice</p>
        <Badge variant={q.userAnswer.value ? 'default' : 'secondary'} className="mt-1">
          {q.userAnswer.value ? 'True' : 'False'}
        </Badge>
      </div>
      {isWrong && (
        <div className="p-3 rounded-md border bg-green-50 border-green-200 flex-1">
          <p className="text-xs text-muted-foreground">Correct</p>
          <Badge variant="outline" className="mt-1 border-green-500 text-green-700">
            {q.correctAnswer ? 'True' : 'False'}
          </Badge>
        </div>
      )}
    </div>
  );
}

function MatchingAnswer({ q }: { q: MatchingQuestion }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Student Matches</p>
        {q.userAnswer.matches.map((m, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded border">
            <span className="font-medium truncate max-w-[100px]">{m.left}</span>
            <span className="text-slate-400">→</span>
            <span
              className={cn(
                'truncate max-w-[100px]',
                q.isCorrect ? 'text-green-700 font-medium' : 'text-red-700'
              )}
            >
              {m.right}
            </span>
          </div>
        ))}
      </div>
      {!q.isCorrect && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Correct Matches</p>
          {q.correctAnswer.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded border border-green-200"
            >
              <span className="font-medium truncate max-w-[100px]">{m.left}</span>
              <span className="text-slate-400">→</span>
              <span className="text-green-700 font-medium truncate max-w-[100px]">{m.right}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderingAnswer({ q }: { q: OrderingQuestion }) {
  const userTexts = q.userAnswer.order.map(
    (id) => q.correctAnswer.find((c) => c.id === id)?.text ?? '???'
  );
  const correctTexts = q.correctAnswer.map((c) => c.text);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Student Order</p>
        <ol className="list-decimal list-inside space-y-1">
          {userTexts.map((txt, i) => (
            <li key={i} className={cn('text-sm p-1 rounded', !q.isCorrect && 'text-red-600')}>
              {txt}
            </li>
          ))}
        </ol>
      </div>
      {!q.isCorrect && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Correct Order
          </p>
          <ol className="list-decimal list-inside space-y-1">
            {correctTexts.map((txt, i) => (
              <li key={i} className="text-sm p-1 rounded text-green-700">
                {txt}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function EssayAnswer({ q }: { q: EssayQuestion }) {
  return (
    <div className="space-y-2">
      <div className="p-4 bg-slate-50 rounded-md border whitespace-pre-wrap text-slate-700 text-sm">
        {q.userAnswer.text || <span className="italic text-slate-400">No answer written.</span>}
      </div>
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Requires manual grading.</span>
      </div>
    </div>
  );
}
