import { getCurrentUser } from "@/lib/auth-server";
import QuizPageView from "@/modules/user/ui/Views/QuizPageView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string; lessonTypeId: string }>;
}) {
  const session = getCurrentUser();
  const { quizId, lessonTypeId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.user.getQuizForTaking.queryOptions({ quizId: +quizId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>something went wrong</div>}>
        <Suspense>
          <QuizPageView quizId={+quizId} lessonTypeId={+lessonTypeId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
