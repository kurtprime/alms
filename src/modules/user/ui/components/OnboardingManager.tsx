// src/modules/user/ui/components/OnboardingManager.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session } from '@/lib/auth-client';
import { OnboardingDialog } from './OnboardingDialog';
import { cn } from '@/lib/utils';

interface Props {
  user: Session['user'];
}

export function OnboardingManager({ user }: Props) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const handleComplete = () => {
    setIsDialogOpen(false);
    router.refresh();
  };

  if (isBannerDismissed && !isDialogOpen) return null;

  return (
    <>
      {/* --- Notification Banner --- */}
      <div
        className={cn(
          'bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 transition-all duration-300',
          isDialogOpen && 'opacity-0 h-0 overflow-hidden p-0 border-0'
        )}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your profile is incomplete. Please update your details to continue.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
              onClick={() => setIsDialogOpen(true)}
            >
              Update Profile
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800"
              onClick={() => setIsBannerDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <OnboardingDialog
        user={user}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onComplete={handleComplete}
      />
    </>
  );
}
