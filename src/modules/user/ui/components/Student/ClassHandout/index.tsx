import { ClassHandoutClient } from "./class-handout";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { ClassHandoutLoading } from "./class-handout-loading";
import { getCurrentUser } from "@/lib/auth-server";

interface HandoutPageProps {
  params: { classId: string; lessonTypeId: number };
}

export default async function ClassHandout({ params }: HandoutPageProps) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getLessonHandout.queryOptions({
      classId: params.classId,
      lessonTypeId: +params.lessonTypeId,
    }),
  );

  void queryClient.prefetchQuery(
    trpc.user.getMarkIsDone.queryOptions({
      lessonTypeId: +params.lessonTypeId,
    }),
  );

  void queryClient.prefetchQuery(
    trpc.user.getCommentsInLessonType.queryOptions({
      lessonTypeId: +params.lessonTypeId,
      privacy: "public",
    }),
  );

  const session = await getCurrentUser();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>something went wrong</div>}>
        <Suspense fallback={<ClassHandoutLoading />}>
          <ClassHandoutClient session={session} params={params} />;
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
