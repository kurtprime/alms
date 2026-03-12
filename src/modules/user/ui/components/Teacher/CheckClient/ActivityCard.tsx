"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Users, FileText, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { Activity } from "./types";
import { StudentListTable } from "./StudentListTable";
import { Progress } from "@/components/ui/progress";

interface Props {
  activity: Activity;
  classId: string;
}

export function ActivityCard({ activity, classId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate Stats
  const stats = useMemo(() => {
    const submittedCount = activity.submissions.filter(
      (s) => s.status !== "missing",
    ).length;
    const gradedCount = activity.submissions.filter(
      (s) => s.status === "graded",
    ).length;
    const pendingCount = activity.submissions.filter(
      (s) => s.status === "pending" || s.status === "late",
    ).length;

    const progress =
      submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0;

    return {
      totalStudents: activity.totalStudents,
      submitted: submittedCount,
      graded: gradedCount,
      pending: pendingCount,
      progress,
    };
  }, [activity]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <Card className="overflow-hidden transition-all duration-200 data-[state=open]:shadow-lg data-[state=open]:border-blue-200">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800">
                    {activity.title}
                  </h3>
                  <Badge variant="secondary" className="rounded-sm text-[10px]">
                    {activity.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {stats.totalStudents} Students
                  </span>
                  <span className="flex items items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {stats.graded} Graded
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {stats.pending} Pending
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-48 mr-4 hidden md:block">
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-medium text-slate-700">
                    {stats.progress}%
                  </span>
                </div>
                <Progress
                  value={stats.progress}
                  className="h-2 bg-slate-100 [&>div]:bg-green-500"
                />
              </div>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t bg-slate-50/50 p-4">
            <StudentListTable
              submissions={activity.submissions}
              classId={classId}
              activityId={activity.id}
            />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
