import { getCurrentAdmin } from "@/lib/auth";
import SectionHeader from "@/modules/admin/ui/section/components/SectionHeader";
import SectionView from "@/modules/admin/ui/section/views/SectionView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function page() {
  await getCurrentAdmin();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.admin.getManySections.queryOptions({}));

  return (
    <>
      <SectionHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>TODO: Loading...</div>}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <SectionView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
