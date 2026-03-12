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
import { Eye, Clock, CheckCircle, AlertCircle, UserX } from "lucide-react";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { cn } from "@/lib/utils";
import { StudentSubmission, SubmissionStatus } from "./types";

const statusConfig: Record<
  SubmissionStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  graded: {
    label: "Graded",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  late: {
    label: "Late",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  missing: {
    label: "Missing",
    className: "bg-slate-100 text-slate-500 border-slate-200",
    icon: UserX,
  },
};

interface Props {
  submissions: StudentSubmission[];
  onSelectSubmission: (sub: StudentSubmission) => void;
}

export function SubmissionsTable({ submissions, onSelectSubmission }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-10 border rounded-md bg-slate-50/50 mt-4">
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
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[300px] font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Score</TableHead>
            <TableHead className="text-right font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const StatusIcon = statusConfig[sub.status].icon;
            return (
              <TableRow key={sub.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {sub.studentImage ? (
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={sub.studentImage} />
                        <AvatarFallback>
                          {sub.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        className="h-9 w-9 border"
                        seed={separateFullName(sub.studentName).join(" ")}
                        variant="initials"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">
                        {sub.studentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sub.submittedAt
                          ? `Submitted ${sub.submittedAt.toLocaleDateString()}`
                          : "Not submitted"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-medium",
                      statusConfig[sub.status].className,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig[sub.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {sub.score !== null ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-slate-800">
                        {sub.score}
                      </span>
                      <span className="text-xs text-slate-400">
                        / {sub.maxScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-sm">--</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
