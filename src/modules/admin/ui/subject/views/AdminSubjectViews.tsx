import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import AdminCreatedSubjects from "../components/AdminCreatedSubjects";

export default function AdminSubjectViews() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.admin.getAllAdminSubject.queryOptions({})
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>TODO: Loading...</div>}>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <AdminCreatedSubjects />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
