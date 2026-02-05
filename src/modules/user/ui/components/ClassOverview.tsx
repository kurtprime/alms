import { getQueryClient, trpc } from "@/trpc/server";
import React, { Suspense } from "react";
import ClassOverviewClient from "./ClassOverviewClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import AddLessonHeader from "./Teacher/AddLessonHeader";
import { Session } from "@/lib/auth-client";

export default function ClassOverview({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getAllLessonsInClass.queryOptions({
      classId,
    }),
  );
  return (
    <>
      <AddLessonHeader classId={classId} session={session} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <ClassOverviewClient classId={classId} />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
