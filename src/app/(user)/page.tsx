import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import CurrentSectionClass from '@/modules/user/ui/Views/CurrentSectionClass';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { session } from '../../db/schemas/auth-schema';

export default async function Page() {
  const session = await getCurrentUser();

  if (!session) {
    redirect('/sign-in');
  }

  const userRole = session.user.role;

  if (userRole === 'teacher') {
    redirect('/teacher');
  } else if (userRole === 'student') {
    redirect('/student');
  } else if (userRole === 'admin') {
    redirect('/admin');
  }

  redirect('/teacher');
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.user.getCurrentSectionInfo.queryOptions());
  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <CurrentSectionClass session={session} />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
