"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Users } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import { GradingDialog } from "./GradingDialog";
import { ClassSubject, Activity, StudentSubmission } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter, useParams, usePathname } from "next/navigation"; // 1. Import hooks

export default function CheckClient() {
  const trpc = useTRPC();
  const router = useRouter();
  const params = useParams(); // 2. Get params from URL
  const pathname = usePathname();

  // 3. Fetch Data
  const {
    data: classes,
    isLoading,
    isError,
  } = useSuspenseQuery(trpc.user.getActivityPerClass.queryOptions());

  // 4. Derive selectedClassId from URL params
  // If we are on /check/abc, params.classId is "abc"
  // If we are on /check, params.classId is undefined
  const selectedClassId = (params.classId as string) || null;

  // Find the selected class object
  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  // Dialog State
  const [activeSubmission, setActiveSubmission] =
    useState<StudentSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 5. Handle Selection Change -> Update Route
  const handleClassChange = (value: string) => {
    // Navigate to the actual route path
    router.push(`/check/${value}`);
  };

  const handleOpenCheck = (submission: StudentSubmission) => {
    setActiveSubmission(submission);
    setIsDialogOpen(true);
  };

  const handleSaveGrade = (score: number, feedback: string) => {
    console.log("Saving grade:", {
      submissionId: activeSubmission?.id,
      score,
      feedback,
    });
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!classes || isError) {
    return (
      <div className="flex justify-center py-24 text-red-500">
        Error loading classes.
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Submission Checker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review and grade student submissions for your active classes.
          </p>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 shadow-sm">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Select Class
        </Label>
        <Select
          value={selectedClassId || ""} // Controlled by URL
          onValueChange={handleClassChange} // Updates URL
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-slate-800">
            <SelectValue placeholder="Select a class..." />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                <span className="font-medium">{cls.code}</span>
                <span className="text-muted-foreground ml-1">- {cls.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Area */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {selectedClass ? (
            <motion.div
              key={selectedClass.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Activities List */}
              {selectedClass.activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-white dark:bg-slate-900">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                  <p>No activities found for this class.</p>
                </div>
              ) : (
                selectedClass.activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    classId={selectedClass.id}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <Users className="h-10 w-10 mx-auto mb-2 text-slate-200" />
              <p>Please select a class to view activities.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GradingDialog
        submission={activeSubmission}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveGrade}
      />
    </div>
  );
}
