import { TabsContent } from "@/components/ui/tabs";
import React, { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import AdminCreateTeacher from "./AdminCreateTeacher";
import AdminTeacherTable from "./AdminTeacherTable";

export default function AdminTeacherTab() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.admin.getManyTeachers.queryOptions({}));
  return (
    <TabsContent value="teachers">
      <AdminCreateTeacher />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>TODO: Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <AdminTeacherTable />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </TabsContent>
  );
}
