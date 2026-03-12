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
import Link from "next/link";
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
  classId: string;
  activityId: string;
}

export function StudentListTable({ submissions, classId, activityId }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border rounded-md bg-slate-50/50 mt-2">
        <UserX className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p className="font-medium">No submissions recorded</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden mt-2">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[250px] font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Score</TableHead>
            <TableHead className="text-right font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const StatusIcon = statusConfig[sub.status].icon;
            // Construct the checking URL
            const checkUrl = `/check/${classId}/${activityId}/${sub.studentId}`;

            return (
              <TableRow key={sub.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {sub.studentImage ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.studentImage} />
                        <AvatarFallback>
                          {sub.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        className="h-8 w-8"
                        seed={separateFullName(sub.studentName).join(" ")}
                        variant="initials"
                      />
                    )}
                    <span className="font-medium">{sub.studentName}</span>
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
                    <span className="font-bold text-slate-700">
                      {sub.score}
                      <span className="text-xs text-slate-400">
                        /{sub.maxScore}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-300 text-sm">--</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={checkUrl}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" /> Check
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
