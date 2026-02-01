import { getCurrentUser } from "@/lib/auth-server";
import CurrentSectionClass from "@/modules/user/ui/components/Views/CurrentSectionClass";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function page() {
  await getCurrentUser();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.user.getCurrentSectionInfo.queryOptions(),
  );
  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <CurrentSectionClass />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
