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
} from "lucide-react"; // Added Loader2, XCircle
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { cn } from "@/lib/utils";
import { StudentSubmission, SubmissionStatus } from "./types";

// 2. Update config to match Database Enum Values
const statusConfig: Record<
  SubmissionStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    icon: Loader2,
  },
  submitted: {
    label: "Submitted",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  graded: {
    label: "Graded",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    icon: CheckCircle,
  },
  expired: {
    label: "Expired",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
};

// Fallback for missing/null status
const missingConfig = {
  label: "No Attempt",
  className:
    "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  icon: UserX,
};

interface Props {
  submissions: StudentSubmission[];
  onSelectSubmission: (sub: StudentSubmission) => void;
}

export function SubmissionsTable({ submissions, onSelectSubmission }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-10 border rounded-md bg-slate-50/50 dark:bg-slate-900/50 mt-4">
        <UserX className="h-10 w-10 mb-2 text-slate-300" />
        <p className="font-medium">No submissions yet</p>
        <p className="text-xs">
          Students haven&apos;t submitted work for this activity.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg mt-4 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
          <TableRow>
            <TableHead className="w-[300px] font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Score</TableHead>
            <TableHead className="text-right font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            // Handle null status by falling back to missingConfig
            const config = sub.status
              ? statusConfig[sub.status]
              : missingConfig;
            const StatusIcon = config.icon;

            return (
              <TableRow key={sub.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {sub.studentImage ? (
                      <Avatar className="h-9 w-9 border dark:border-slate-700">
                        <AvatarImage src={sub.studentImage} />
                        <AvatarFallback>
                          {sub.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        className="h-9 w-9 border dark:border-slate-700"
                        seed={separateFullName(sub.studentName).join(" ")}
                        variant="initials"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {sub.studentName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sub.submittedAt
                          ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString()}`
                          : "Not submitted"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("gap-1 font-medium", config.className)}
                  >
                    <StatusIcon
                      className={cn(
                        "h-3 w-3",
                        // Add spin animation for in_progress
                        sub.status === "in_progress" && "animate-spin",
                      )}
                    />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {sub.score !== null ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {sub.score}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        / {sub.maxScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-sm">
                      --
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    onClick={() => onSelectSubmission(sub)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> Check
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
