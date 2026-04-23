import { getCurrentUser } from '@/lib/auth-server';
import TeacherQuizzesView from '@/modules/user/ui/Views/TeacherQuizzesView';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function TeacherQuizzesPage() {
  const session = await getCurrentUser();

  if (session.user.role !== 'teacher') {
    if (session.user.role === 'student') {
      redirect('/student');
    } else if (session.user.role === 'admin') {
      redirect('/admin');
    }
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.user.getTeacherQuizzes.queryOptions());
  void queryClient.prefetchQuery(trpc.user.getTeacherQuizStats.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TeacherQuizzesSkeleton />}>
        <ErrorBoundary fallback={<div className="p-6">Something went wrong loading quizzes</div>}>
          <TeacherQuizzesView session={session} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}

function TeacherQuizzesSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
