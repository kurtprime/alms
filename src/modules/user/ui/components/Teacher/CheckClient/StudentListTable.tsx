"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  UserX,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { cn } from "@/lib/utils";

// ==========================================
// TYPES (Strictly matching Backend Query)
// ==========================================

export type SubmissionStatus =
  | "in_progress"
  | "submitted"
  | "graded"
  | "expired";

export interface StudentSubmission {
  id: string; // user.id
  studentId: string; // user.id
  studentName: string | null; // DB can be null
  studentImage: string | null;
  status: SubmissionStatus | null; // DB enum or null
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null; // ISO string
}

// ==========================================
// STATUS CONFIG
// ==========================================

const statusConfig: Record<
  SubmissionStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    icon: Loader2,
  },
  submitted: {
    label: "Needs Grading", // More descriptive for teacher
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  graded: {
    label: "Graded",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle,
  },
  expired: {
    label: "Expired",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
};

// Fallback for missing data
const missingConfig = {
  label: "No Attempt",
  className:
    "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  icon: UserX,
};

// ==========================================
// COMPONENT
// ==========================================

interface Props {
  submissions: StudentSubmission[];
  classId: string;
  activityId: string;
}

export function StudentListTable({ submissions, classId, activityId }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-12 border rounded-lg bg-slate-50/30 dark:bg-slate-900/30 mt-2">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
          <UserX className="h-8 w-8 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          No Submissions Found
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          No students have started this activity yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden mt-2 bg-white dark:bg-slate-900 shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40%] font-semibold text-slate-600 dark:text-slate-300">
              Student
            </TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300">
              Status
            </TableHead>
            <TableHead className="text-center font-semibold text-slate-600 dark:text-slate-300">
              Score
            </TableHead>
            <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300">
              Date
            </TableHead>
            <TableHead className="w-[80px] text-right font-semibold text-slate-600 dark:text-slate-300">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const hasValidStatus = sub.status && statusConfig[sub.status];
            const config = hasValidStatus
              ? statusConfig[sub.status ?? "in_progress"]
              : missingConfig;
            const StatusIcon = config.icon;

            const checkUrl = `/check/${classId}/${activityId}/${sub.studentId}`;

            return (
              <TableRow
                key={sub.id}
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Student Info */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {sub.studentImage ? (
                      <Avatar className="h-9 w-9 border dark:border-slate-700">
                        <AvatarImage
                          src={sub.studentImage}
                          alt={sub.studentName || "Student"}
                        />
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                          {sub.studentName?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        className="h-9 w-9 border dark:border-slate-700"
                        seed={separateFullName(sub.studentName || "").join(" ")}
                        variant="initials"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {sub.studentName || "Unknown Student"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 font-medium border px-2.5 py-1 text-xs",
                      config.className,
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "h-3.5 w-3.5",
                        sub.status === "in_progress" && "animate-spin",
                      )}
                    />
                    {config.label}
                  </Badge>
                </TableCell>

                {/* Score */}
                <TableCell className="text-center">
                  {sub.score !== null ? (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {sub.score}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5">
                        / {sub.maxScore ?? "--"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-sm">
                      --
                    </span>
                  )}
                </TableCell>

                {/* Date */}
                <TableCell className="text-right text-sm text-slate-500 dark:text-slate-400">
                  {sub.submittedAt
                    ? new Date(sub.submittedAt).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Manila',
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  <Link href={checkUrl}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 h-8 px-3"
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Review
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
