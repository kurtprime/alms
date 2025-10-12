import { TabsContent } from "@/components/ui/tabs";
import React, { Suspense } from "react";
import AdminCreateStudent from "./AdminCreateStudent";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import AdminStudentTable from "./AdminStudentTable";

export default async function AdminStudentTab() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.admin.getManyStudents.queryOptions({}));

  return (
    <TabsContent value="students">
      <AdminCreateStudent />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>TODO: Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <AdminStudentTable />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </TabsContent>
  );
}
