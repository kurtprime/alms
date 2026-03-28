// src/components/SidebarAccordion.tsx
'use client';

import React from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FolderClosed, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';

export default function SidebarAccordion({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();

  // Fetch summary data
  const { data, isLoading, isError } = useQuery(trpc.user.getTeacherCheckSummary.queryOptions());

  // Find the class with the most pending items (for the "To Check" shortcut)
  const primaryClass = data?.find((c) => c.pendingCount > 0) ?? data?.[0];

  if (isLoading) {
    return (
      <div className="p-2 flex justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-2 text-xs text-destructive flex items-center gap-1 justify-center">
        <AlertCircle className="h-3 w-3" /> Error loading
      </div>
    );
  }

  return (
    <>
      {/* --- 'To Check' Master Button --- */}
      {primaryClass ? (
        <>
          {/* MOBILE: Direct Link to Grading Page */}
          <div className="block lg:hidden">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-4 py-2 hover:bg-sidebar-accent"
              asChild
            >
              <Link href={`/check/${primaryClass.classId}`}>
                <FolderClosed className="w-4 h-4" />
                <span>To Check</span>
                {primaryClass.pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 px-1.5">
                    {primaryClass.pendingCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>

          {/* DESKTOP: Hover Card for Grading */}
          <div className="hidden lg:block">
            <HoverCard openDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-4 py-2 hover:bg-sidebar-accent"
                >
                  <FolderClosed className="w-4 h-4" />
                  <span>To Check</span>
                  {primaryClass.pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5">
                      {primaryClass.pendingCount}
                    </Badge>
                  )}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                align="start"
                className="w-72 p-2 border-l shadow-lg ml-2 rounded-lg"
              >
                <div className="p-2 border-b mb-1 font-semibold text-sm flex justify-between">
                  <span>Pending Reviews</span>
                  <span className="text-muted-foreground">
                    {data.reduce((acc, c) => acc + c.pendingCount, 0)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {data.slice(0, 5).map((item) => (
                    <Button
                      key={item.classId}
                      variant="ghost"
                      className="w-full justify-between items-center h-auto py-2"
                      // LINK: To Check Page
                      onClick={() => router.push(`/check/${item.classId}`)}
                    >
                      <span className="truncate text-xs">{item.className}</span>
                      {item.pendingCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                        >
                          {item.pendingCount}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </>
      ) : null}

      {/* --- Class List (Accordion) --- */}
      <AccordionItem value="classes" className="border-none">
        {/* MOBILE */}
        <AccordionTrigger className="p-2 hover:bg-sidebar-accent cursor-pointer px-4 border-none bg-sidebar shadow-none flex flex-row-reverse items-center justify-between lg:hidden">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Classes
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-0 ml-2 w-[calc(100%-1rem)] mt-0 mb-4 border-l lg:hidden">
          <div className="space-y-1 pt-2">
            {data.map((item) => (
              <Button
                key={item.classId}
                variant="ghost"
                className="w-full justify-start gap-2 text-xs relative group"
                asChild
              >
                {/* FIX: Link to Class Page */}
                <Link href={`/class/${item.classId}`}>
                  <span className="truncate">{item.className}</span>
                  {item.pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-4 px-1 text-[10px]">
                      {item.pendingCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </AccordionContent>

        {/* DESKTOP */}
        <div className="hidden lg:block">
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-4 py-2 hover:bg-sidebar-accent"
              >
                <Users className="w-4 h-4" />
                <span>Classes</span>
                <Badge variant="outline" className="ml-auto bg-background">
                  {data.length}
                </Badge>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              className="w-72 p-2 border-l shadow-lg ml-2 rounded-lg"
            >
              <div className="p-2 border-b mb-1 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Your Classes
              </div>
              <div className="space-y-0.5">
                {data.map((item) => (
                  <Button
                    key={item.classId}
                    variant="ghost"
                    className="w-full justify-between items-center h-auto py-2"
                    // FIX: Navigate to Class Page
                    onClick={() => router.push(`/class/${item.classId}`)}
                  >
                    <span className="truncate text-sm">{item.className}</span>
                    {/* Optional: Show pending count here too for visibility */}
                    {item.pendingCount > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-2 shrink-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                      >
                        {item.pendingCount} pending
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </AccordionItem>
    </>
  );
}
