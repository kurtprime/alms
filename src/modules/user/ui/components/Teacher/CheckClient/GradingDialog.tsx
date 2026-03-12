"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, FileText, Maximize2 } from "lucide-react";
import { StudentSubmission } from "./types";
import { Separator } from "@/components/ui/separator";

interface Props {
  submission: StudentSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (score: number, feedback: string) => void;
}

export function GradingDialog({
  submission,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (open && submission) {
      // Use a microtask to defer state updates
      queueMicrotask(() => {
        setScore(submission.score?.toString() || "");
        setFeedback("");
      });
    }
  }, [open, submission]);

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0">
        {/* Split Layout Container */}
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* LEFT: File Preview */}
          <div className="flex-1 bg-slate-50 p-4 flex flex-col border-b md:border-b-0 md:border-r">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base">
                Submission Preview
              </DialogTitle>
              <DialogDescription>
                {submission.studentName}&apos;s Work
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 border rounded-md bg-white flex items-center justify-center text-slate-400 relative overflow-hidden">
              <div className="text-center z-10">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-medium text-slate-600">
                  File Preview
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click to open full screen
                </p>
              </div>
              {/* Placeholder for actual viewer */}
            </div>
          </div>

          {/* RIGHT: Grading Form */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-800">Grading</h3>
              <p className="text-xs text-slate-500">Enter score and feedback</p>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Score Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Score
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    max={submission.maxScore ?? undefined}
                    min={0}
                    className="text-lg font-bold h-11 w-24 text-center"
                  />
                  <span className="text-sm text-slate-500">
                    / {submission.maxScore}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Feedback Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Feedback
                </label>
                <Textarea
                  placeholder="Write your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => onSave(parseFloat(score) || 0, feedback)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Grade
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
