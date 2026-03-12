import React, { Suspense } from "react";
import CheckClient from "../components/Teacher/CheckClient";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

export default function CheckView() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.user.getActivityPerClass.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>something went wrong</div>}>
        <Suspense>
          <CheckClient />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
