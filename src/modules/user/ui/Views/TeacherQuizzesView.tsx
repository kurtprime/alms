'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';
import { useState, useMemo } from 'react';
import QuizCard from '@/modules/user/ui/components/Teacher/QuizCard';

interface TeacherQuizzesViewProps {
  session: Session;
}

export default function TeacherQuizzesView({ session }: TeacherQuizzesViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: quizzes } = useSuspenseQuery(trpc.user.getTeacherQuizzes.queryOptions());
  const { data: stats } = useSuspenseQuery(trpc.user.getTeacherQuizStats.queryOptions());

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleStatusMutation = useMutation(
    trpc.admin.updateLessonTypeStatus.mutationOptions({
      onMutate: (vars) => setTogglingId(vars.id),
      onSettled: () => setTogglingId(null),
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.getTeacherQuizzes.queryFilter());
        queryClient.invalidateQueries(trpc.user.getTeacherQuizStats.queryFilter());
      },
    })
  );

  const uniqueClasses = useMemo(() => {
    const classMap = new Map<string, string>();
    quizzes.forEach((q) => classMap.set(q.classSubjectId, q.className));
    return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        !searchQuery ||
        (q.quizName || q.lessonTypeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = classFilter === 'all' || q.classSubjectId === classFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && q.lessonTypeStatus === 'published') ||
        (statusFilter === 'draft' && q.lessonTypeStatus === 'draft');

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [quizzes, searchQuery, classFilter, statusFilter]);

  const handleStatusToggle = (lessonTypeId: number, newStatus: 'published' | 'draft') => {
    toggleStatusMutation.mutate({ id: lessonTypeId, status: newStatus });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || 'Teacher'}</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/class')}>
          <Plus className="h-4 w-4" />
          Go to Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">In all quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Student attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            {stats.pendingGrading > 0 ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={
                stats.pendingGrading > 0
                  ? 'text-2xl font-bold text-amber-600'
                  : 'text-2xl font-bold text-emerald-600'
              }
            >
              {stats.pendingGrading}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingGrading > 0 ? 'Submissions to grade' : 'All caught up'}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.pendingGrading > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  You have {stats.pendingGrading} submission{stats.pendingGrading !== 1 ? 's' : ''}{' '}
                  pending review
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Students are waiting for their grades. Review them now to keep your class on
                  track.
                </p>
              </div>
              <Button
                onClick={() => router.push('/check')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes by name, class, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {uniqueClasses.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={classFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setClassFilter('all')}
            >
              All Classes
            </Button>
            {uniqueClasses.map((cls) => (
              <Button
                key={cls.id}
                variant={classFilter === cls.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setClassFilter(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'published', 'draft'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {quizzes.length === 0 ? 'No Quizzes Yet' : 'No quizzes match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {quizzes.length === 0
                ? 'Get started by creating a quiz from one of your classes. You can add questions and settings once created.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {quizzes.length === 0 && (
              <Button onClick={() => router.push('/class')}>
                <Plus className="h-4 w-4 mr-2" />
                Go to Your Classes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.quizId}
              quiz={quiz}
              onStatusToggle={handleStatusToggle}
              isTogglingStatus={togglingId === quiz.lessonTypeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
