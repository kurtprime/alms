import { getCurrentUser } from "@/lib/auth-server";
import QuizViewDetails from "@/modules/user/ui/Views/QuizViewDetails";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function page({
  params,
}: {
  params: Promise<{ lessonTypeId: string; classId: string }>;
}) {
  const param = await params;
  const session = await getCurrentUser();

  const queryClient = getQueryClient();

  queryClient.prefetchQuery(
    trpc.user.getQuizPreview.queryOptions({
      lessonTypeId: +param.lessonTypeId,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <ErrorBoundary fallback={<div>something went wrong</div>}>
          <QuizViewDetails
            lessonTypeId={+param.lessonTypeId}
            classId={param.classId}
          />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
