import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { Accordion } from '@/components/ui/accordion';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import SidebarAccordion from './components/Teacher/SidebarAccordion';
import SidebarMenuItemsParams from './components/SidebarMenuItemsParams';
import StudentSideBarAccordion from './components/Student/StudentSidebarAccordion';
import Image from 'next/image';

export function AppSidebar() {
  return (
    <Sidebar className="rounded-r-3xl" collapsible="icon">
      <SidebarContent className="rounded-r-3xl">
        <div className="px-3 py-4">
          <Image
            src="/assets/ark-logo.png"
            alt="Logo"
            width={120}
            height={40}
            className="mx-auto object-contain"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItemsParams />
              <DynamicSideBar />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

async function DynamicSideBar() {
  const session = await getCurrentUser();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.user.getCurrentSectionInfo.queryOptions());

  if (session.user.role === 'teacher') {
    return (
      <>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<div>Loading...</div>}>
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              <Accordion type="multiple">
                <SidebarAccordion session={session} />
              </Accordion>
            </ErrorBoundary>
          </Suspense>
        </HydrationBoundary>
      </>
    );
  }

  if (session.user.role === 'student')
    return (
      <>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<div>Loading...</div>}>
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              <Accordion type="multiple">
                <StudentSideBarAccordion session={session} />
              </Accordion>
            </ErrorBoundary>
          </Suspense>
        </HydrationBoundary>
      </>
    );

  return null;
}
