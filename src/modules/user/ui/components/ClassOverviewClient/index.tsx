'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Session } from '@/lib/auth-client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ResizableContent } from './resizable-content';
import { type Lesson } from './types';

export default function ClassOverviewClient({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.user.getAllLessonsWithContentsInClass.queryOptions({ classId })
  );

  const lessons = data as Lesson;
  const isTeacher = session.user.role === 'teacher';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full bg-slate-50/50">
        <ResizableContent
          classId={classId}
          isTeacher={isTeacher}
          lessons={lessons}
          session={session}
        />
      </div>
    </TooltipProvider>
  );
}

export * from './types';
