'use client';

import { Session } from '@/lib/auth-client';
import { type Lesson } from './types';
import { EmptyState } from './empty-state';
import { TopicSection } from './ topic-section';

export function ResizableContent({
  classId,
  isTeacher,
  lessons,
  session,
}: {
  classId: string;
  isTeacher: boolean;
  lessons: Lesson;
  session: Session;
}) {
  return (
    <div className="h-full overflow-auto">
      <div className="w-full mx-auto px-4 md:px-15 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4">
            {lessons.map((lesson) => (
              <TopicSection key={lesson.id} classId={classId} session={session} lesson={lesson} />
            ))}

            {lessons.length === 0 && <EmptyState isTeacher={isTeacher} classId={classId} />}
          </div>
        </div>
      </div>
    </div>
  );
}
