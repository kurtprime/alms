import { getCurrentUser } from '@/lib/auth-server';
import StudentDashboardClient from '@/modules/user/ui/Views/StudentDashboardClient';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function StudentDashboardPage() {
  const session = await getCurrentUser();

  if (session.user.role !== 'student') {
    if (session.user.role === 'teacher') {
      redirect('/teacher');
    } else if (session.user.role === 'admin') {
      redirect('/admin');
    }
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.user.getCurrentSectionInfo.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<StudentDashboardSkeleton />}>
        <ErrorBoundary fallback={<div className="p-6">Something went wrong loading dashboard</div>}>
          <StudentDashboardClient session={session} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
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
