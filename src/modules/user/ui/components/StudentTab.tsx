import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import StudentListClient from "./StudentListClient";
import { ErrorBoundary } from "react-error-boundary";

export default function StudentTab({ classId }: { classId: string }) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getAllStudentsInClass.queryOptions({
      classId,
    }),
  );
  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<div>Something went wrong loading students</div>}
        >
          <Suspense fallback={<div>Loading students...</div>}>
            <StudentListClient classId={classId} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </>
  );
}
