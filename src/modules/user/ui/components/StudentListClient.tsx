"use client";

import React from "react";
import Image from "next/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardCheck, TrendingUp } from "lucide-react";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils"; // Moved import to top

// --- 1. TYPE DEFINITIONS ---
interface StudentProgress {
  handouts: { completed: number; total: number };
  activities: { completed: number; total: number };
}

interface Student {
  userId: string;
  userName: string;
  userImage: string | null;
  progress?: StudentProgress; // Optional because backend might not return it yet
}

// ----------------------------------------------------------------

export default function StudentListClient({ classId }: { classId: string }) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.user.getAllStudentsInClass.queryOptions({
      classId,
    }),
  );

  // Helper to calculate percentage safely
  const getPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Helper for progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-amber-500";
    return "bg-green-500";
  };

  // Helper for progress bar background
  const getProgressBg = (percentage: number) => {
    if (percentage < 30) return "bg-red-100 dark:bg-red-900/30";
    if (percentage < 70) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-green-100 dark:bg-green-900/30";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 w-full">
      {data.map((student: Student) => {
        // FIX: Removed Math.random(). Using static 0 values or provided data.
        // Since your backend likely doesn't return 'progress' yet, we default to 0.
        const progress = student.progress || {
          handouts: { completed: 0, total: 0 },
          activities: { completed: 0, total: 0 },
        };

        const handoutPerc = getPercentage(
          progress.handouts.completed,
          progress.handouts.total,
        );
        const activityPerc = getPercentage(
          progress.activities.completed,
          progress.activities.total,
        );

        return (
          <Card
            key={student.userId}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4"
            style={{ borderTopColor: handoutPerc > 80 ? "#22c55e" : "#6366f1" }}
          >
            <CardHeader className="flex flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 space-y-0">
              <div className="flex-shrink-0">
                {student.userImage ? (
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src={student.userImage}
                      fill
                      className="object-cover"
                      alt={student.userName}
                    />
                  </div>
                ) : (
                  <GeneratedAvatar
                    className="h-12 w-12 border-2 border-white shadow-sm"
                    variant="initials"
                    seed={separateFullName(student.userName).join(" ")}
                  />
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {student.userName}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    {progress.handouts.completed +
                      progress.activities.completed}{" "}
                    tasks done
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Handouts Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Handouts</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {progress.handouts.completed}/{progress.handouts.total}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full overflow-hidden",
                    getProgressBg(handoutPerc),
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getProgressColor(handoutPerc),
                    )}
                    style={{ width: `${handoutPerc}%` }}
                  />
                </div>
              </div>

              {/* Activities Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">Activities</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {progress.activities.completed}/{progress.activities.total}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full overflow-hidden",
                    getProgressBg(activityPerc),
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getProgressColor(activityPerc),
                    )}
                    style={{ width: `${activityPerc}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
