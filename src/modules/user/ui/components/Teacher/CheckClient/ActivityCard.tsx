"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  ChevronDown,
  Loader2,
  XCircle,
} from "lucide-react";
import { Activity } from "./types";
import { StudentListTable } from "./StudentListTable";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  activity: Activity;
  classId: string;
}

export function ActivityCard({ activity, classId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate Stats based on valid Enum statuses
  const stats = useMemo(() => {
    const totalStudents = activity.totalStudents;

    // Counts based on statuses
    const inProgress = activity.submissions.filter(
      (s) => s.status === "in_progress",
    ).length;

    const submitted = activity.submissions.filter(
      (s) => s.status === "submitted",
    ).length;

    const graded = activity.submissions.filter(
      (s) => s.status === "graded",
    ).length;

    const expired = activity.submissions.filter(
      (s) => s.status === "expired",
    ).length;

    // Logic for "Needs Grading" = Submitted + Expired
    const needsGrading = submitted + expired;

    // Completion percentage (Graded vs Total Submissions)
    // If no one submitted, progress is 0.
    const submissionCount = activity.submissions.length;
    const progress =
      submissionCount > 0 ? Math.round((graded / submissionCount) * 100) : 0;

    return {
      totalStudents,
      inProgress,
      submitted,
      graded,
      expired,
      needsGrading,
      progress,
      submissionCount,
    };
  }, [activity]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <Card className="overflow-hidden transition-all duration-200 border-slate-200 dark:border-slate-800 data-[state=open]:shadow-lg data-[state=open]:border-blue-300 dark:data-[state=open]:border-blue-800">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 shrink-0">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activity.title || "Untitled Activity"}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="rounded-sm text-[10px] font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {activity.type}
                  </Badge>
                </div>

                {/* Status Counts */}
                <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5" />
                    {stats.totalStudents}
                  </span>

                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {stats.graded} Graded
                  </span>

                  {stats.needsGrading > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {stats.needsGrading} Need Grading
                    </span>
                  )}

                  {stats.inProgress > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {stats.inProgress} In Progress
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar (Visible on MD+) */}
            <div className="items-center gap-4 w-40 mr-4 hidden md:flex shrink-0">
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Grading</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {stats.progress}%
                  </span>
                </div>
                <Progress
                  value={stats.progress}
                  className="h-2 bg-slate-100 dark:bg-slate-700"
                  // Custom indicator color for success
                />
              </div>
            </div>

            {/* Expand Icon */}
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 group-hover:text-slate-600",
                isOpen ? "rotate-180" : "",
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Submissions ({stats.submissionCount} of {stats.totalStudents})
              </h4>
            </div>
            <StudentListTable
              submissions={activity.submissions}
              classId={classId}
              activityId={String(activity.id)}
            />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
