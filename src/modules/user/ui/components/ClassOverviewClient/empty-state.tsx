"use client";

import { ClipboardList } from "lucide-react";
import AddLessonBtn from "../Teacher/AddLesson";

// ============================================
// EMPTY STATE
// ============================================

export function EmptyState({
  isTeacher,
  classId,
}: {
  isTeacher: boolean;
  classId: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center">
        <ClipboardList className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        No content yet
      </h3>
      <p className="text-sm text-slate-500 mb-5 text-center max-w-xs">
        {isTeacher
          ? "Start building your course by adding handouts, quizzes, or assignments"
          : "Check back soon for new learning materials"}
      </p>
      {isTeacher && <AddLessonBtn classId={classId} />}
    </div>
  );
}
