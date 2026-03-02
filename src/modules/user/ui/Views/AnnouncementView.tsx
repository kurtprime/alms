import { Session } from "@/lib/auth-client";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import AnnouncementOverview from "../components/AnnouncementOverview";

export default function AnnouncementView({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.user.getClassAnnouncement.queryOptions({
      classId,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading Suspense...</div>}>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <AnnouncementOverview classId={classId} session={session} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
