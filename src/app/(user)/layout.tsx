import { SidebarProvider } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { AppSidebar } from '@/modules/user/ui/AppSidebar';
import { OnboardingManager } from '@/modules/user/ui/components/OnboardingManager';
import UserNavigation from '@/modules/user/ui/UserNavigation';
import { TRPCReactProvider } from '@/trpc/client';
import React from 'react';

export default async function layout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  // Logic: If timestamps are identical -> New user needs onboarding
  let needsOnboarding = false;
  if (session?.user) {
    const u = session.user;
    const created = new Date(u.createdAt).getTime();
    const updated = new Date(u.updatedAt).getTime();

    // Also check if they have an image/name if you want to enforce it strictly
    if (created === updated) {
      needsOnboarding = true;
    }
  }
  return (
    <TRPCReactProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex justify-stretch items-stretch bg-background flex-col min-h-[calc(100vh)] w-full">
          <UserNavigation />

          {/* Render the Manager which handles Banner + Dialog */}
          {needsOnboarding && session && <OnboardingManager user={session.user} />}

          {children}
        </main>
      </SidebarProvider>
    </TRPCReactProvider>
  );
}
