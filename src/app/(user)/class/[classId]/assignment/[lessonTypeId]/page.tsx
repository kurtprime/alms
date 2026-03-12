import { getCurrentUser } from "@/lib/auth-server";
import { LessonPageClient } from "@/modules/user/ui/components/Student/ClassAssignment/lesson";
import { TeacherLessonView } from "@/modules/user/ui/components/Teacher/TeacherLessonView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function page({
  params,
}: {
  params: Promise<{ lessonTypeId: number; classId: string }>;
}) {
  const param = await params;
  const session = await getCurrentUser();

  const isTeacher = session.user.role === "teacher";

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getLessonAssignment.queryOptions({
      classId: param.classId,
      lessonTypeId: +param.lessonTypeId,
    }),
  );

  void queryClient.prefetchQuery(
    trpc.user.getCommentsInLessonType.queryOptions({
      lessonTypeId: +param.lessonTypeId,
      privacy: "public",
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <ErrorBoundary fallback={<div>something went wrong</div>}>
          {isTeacher ? (
            <TeacherLessonView params={param} session={session} />
          ) : (
            <LessonPageClient params={param} session={session} />
          )}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
