import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import StudentListClient from './StudentListClient';
import StudentJoinStatus from './StudentJoinStatus';
import { ErrorBoundary } from 'react-error-boundary';

export default function StudentTab({ classId }: { classId: string }) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getAllStudentsInClass.queryOptions({
      classId,
    })
  );
  void queryClient.prefetchQuery(
    trpc.user.getClassSubjectDetails.queryOptions({
      classId,
    })
  );

  return (
    <>
      <Suspense fallback={<div>Loading status...</div>}>
        <StudentJoinStatus classId={classId} />
      </Suspense>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary fallback={<div>Something went wrong loading students</div>}>
          <Suspense fallback={<div>Loading students...</div>}>
            <StudentListClient classId={classId} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </>
  );
}
