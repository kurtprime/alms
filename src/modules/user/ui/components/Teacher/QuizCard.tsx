'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Edit3,
  FileCheck,
  HelpCircle,
  MoreVertical,
  Send,
  Settings,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuizSettingsDialog } from '@/modules/admin/ui/subject/components/QuizSettingDialog';

interface QuizCardProps {
  quiz: {
    quizId: number;
    quizName: string | null;
    quizDescription: string | null;
    quizStatus: string;
    lessonTypeStatus: 'draft' | 'published' | 'archived';
    lessonTypeName: string | null;
    classSubjectId: string;
    className: string;
    subjectName: string;
    questionCount: number;
    totalSubmissions: number;
    pendingGrading: number;
    timeLimit: number | null;
    maxAttempts: number | null;
    startDate: string | null;
    endDate: string | null;
    lessonTypeId: number;
    createdAt: string;
    updatedAt: string;
  };
  onStatusToggle: (lessonTypeId: number, newStatus: 'published' | 'draft') => void;
  isTogglingStatus: boolean;
}

const themes = [
  {
    accent: 'bg-blue-600',
    border: 'hover:border-blue-400',
    light: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    accent: 'bg-emerald-600',
    border: 'hover:border-emerald-400',
    light: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    accent: 'bg-amber-600',
    border: 'hover:border-amber-400',
    light: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    accent: 'bg-rose-600',
    border: 'hover:border-rose-400',
    light: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    accent: 'bg-indigo-600',
    border: 'hover:border-indigo-400',
    light: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
];

export default function QuizCard({ quiz, onStatusToggle, isTogglingStatus }: QuizCardProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const theme = themes[quiz.quizId % themes.length];
  const isPublished = quiz.lessonTypeStatus === 'published';

  const { data: quizDetails } = useQuery(
    trpc.user.getQuizDetails.queryOptions({ quizId: quiz.quizId }, { enabled: isSettingsOpen })
  );

  const updateSettingsMutation = useMutation(
    trpc.user.updateQuizSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.getTeacherQuizzes.queryFilter());
        setIsSettingsOpen(false);
      },
    })
  );

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300 border-2 border-transparent hover:shadow-lg hover:-translate-y-1',
          theme.border
        )}
      >
        <div className={cn('absolute top-0 left-0 right-0 h-1', theme.accent)} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {quiz.subjectName}
                </Badge>
                <Badge
                  className={cn(
                    'text-xs shrink-0',
                    isPublished
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <CardTitle className="text-lg truncate">
                {quiz.lessonTypeName || quiz.quizName || 'Untitled Quiz'}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">{quiz.className}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/class/${quiz.classSubjectId}/quiz/e/${quiz.quizId}`)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Quiz
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/check/${quiz.classSubjectId}`)}>
                  <FileCheck className="h-4 w-4 mr-2" />
                  View Submissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onStatusToggle(quiz.lessonTypeId, isPublished ? 'draft' : 'published')
                  }
                  disabled={isTogglingStatus}
                >
                  {isPublished ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className={cn('p-3 rounded-lg', theme.light)}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {quiz.totalSubmissions} submission{quiz.totalSubmissions !== 1 ? 's' : ''}
                </span>
              </div>
              {quiz.timeLimit && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{quiz.timeLimit} min</span>
                </div>
              )}
              {quiz.maxAttempts && (
                <div className="flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {quiz.maxAttempts} attempt{quiz.maxAttempts !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {quiz.pendingGrading > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <FileCheck className="h-4 w-4 shrink-0" />
              <span className="font-medium">{quiz.pendingGrading} pending review</span>
            </div>
          )}

          {(quiz.startDate || quiz.endDate) && (
            <div className="text-xs text-muted-foreground">
              {quiz.startDate && <span>From {formatDate(quiz.startDate)}</span>}
              {quiz.startDate && quiz.endDate && <span> — </span>}
              {quiz.endDate && <span>Until {formatDate(quiz.endDate)}</span>}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Updated {formatDate(quiz.updatedAt)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => router.push(`/class/${quiz.classSubjectId}/quiz/e/${quiz.quizId}`)}
            >
              Edit <Edit3 className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuizSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialData={quizDetails}
        onSave={(data) => updateSettingsMutation.mutate({ quizId: quiz.quizId, data })}
        isSaving={updateSettingsMutation.isPending}
      />
    </>
  );
}
