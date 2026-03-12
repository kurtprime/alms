import CreateQuiz from "@/modules/admin/ui/subject/components/CreateQuiz";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getQuizDetails.queryOptions({ quizId: +quizId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>something went wrong</div>}>
        <Suspense>
          <CreateQuiz quizId={+quizId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
