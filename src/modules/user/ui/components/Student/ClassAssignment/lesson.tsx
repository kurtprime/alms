"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LessonContentViewer } from "@/components/lesson-content-viewer"; // Your existing viewer
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Repeat,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Session } from "@/lib/auth-client";
import { LessonComments } from "./lesson-comments";
import { LessonLayout } from "./lesson-layout";
import { useState } from "react";
import ResponsiveDialog from "@/components/responsive-dialog";
import { AssignmentUploader } from "./assignment-uploader";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: { classId: string; lessonTypeId: number };
  session: Session; // Your session object
}

export function LessonPageClient({ params, session }: Props) {
  const trpc = useTRPC();
  const [openUpload, setOpenUpload] = useState(false);
  const [activePrivacy, setActivePrivacy] = useState<"public" | "private">(
    "public",
  );
  // 1. Fetch Data
  const queryClient = useQueryClient();
  const { data: lessonData } = useSuspenseQuery(
    trpc.user.getLessonAssignment.queryOptions({
      classId: params.classId,
      lessonTypeId: +params.lessonTypeId,
    }),
  );

  const { data: comments } = useSuspenseQuery(
    trpc.user.getCommentsInLessonType.queryOptions({
      lessonTypeId: +params.lessonTypeId,
      privacy: "public",
    }),
  );

  // 2. Mutations
  const { mutate: upsertComment, isPending: isPendingComment } = useMutation(
    trpc.user.upsertCommentInLessonType.mutationOptions({
      onSuccess: (data, variable) => {
        queryClient.invalidateQueries(
          trpc.user.getCommentsInLessonType.queryOptions({
            lessonTypeId: +params.lessonTypeId,
            privacy: variable.privacy,
          }),
        );
      },
    }),
  );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const attempts = lessonData.attempts || [];
  const hasSubmitted = attempts.length > 0;

  // 3. Define Action Slot (Dynamic based on Type)
  // This is what makes it reusable for Handouts vs Assignments
  const actionSlot =
    lessonData.type === "assignment" ? (
      <Card className="border-none shadow-sm bg-slate-100 dark:bg-slate-800/50">
        {/* Header with Settings */}
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Points */}
            <div className="flex flex-col items-center gap-1">
              <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                Points
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lessonData.assignmentSettings?.scores ?? 0}
              </span>
            </div>

            {/* Attempts */}
            <div className="flex flex-col items-center gap-1">
              <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                Attempts
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lessonData.assignmentSettings?.maxAttempts ?? "∞"}
              </span>
            </div>

            {/* Due Date */}
            <div className="flex flex-col items-center gap-1">
              <div className="p-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30">
                <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                Due Date
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">
                {formatDate(lessonData.assignmentSettings?.endDate)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Upload Button */}
          <Button
            onClick={() => setOpenUpload(true)}
            className="w-full"
            variant={hasSubmitted ? "outline" : "default"}
          >
            {hasSubmitted ? (
              <>
                <Upload className="h-4 w-4 mr-2" /> Re-submit Assignment
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" /> Upload Assignment
              </>
            )}
          </Button>

          {/* Submission History List */}
          {hasSubmitted && (
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Submission History
              </h4>

              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="border rounded-lg bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    {/* Attempt Header */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 border-b">
                      <div className="flex items-center gap-2">
                        {attempt.status === "graded" ||
                        attempt.score !== null ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Attempt #{attempt.attemptNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {attempt.score !== null && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-bold"
                          >
                            {attempt.score} /{" "}
                            {lessonData.assignmentSettings?.scores ?? 0}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            attempt.status === "graded" ? "default" : "outline"
                          }
                          className="capitalize text-[10px]"
                        >
                          {attempt.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Files in this Attempt */}
                    <div className="p-2 space-y-1.5">
                      {attempt.documents.length > 0 ? (
                        attempt.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                {doc.name || "Unnamed File"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(doc.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                            <Download className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">
                          No files attached in this attempt
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ) : (
      // Handout "Mark as Done"
      <Card className="border-none shadow-sm bg-slate-100 dark:bg-slate-800/50">
        <CardContent className="p-4">
          <Button variant="outline" className={cn("w-full gap-2")}>
            <Check className="h-4 w-4" /> Mark as Done
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <>
      <LessonLayout
        data={lessonData}
        sessionUser={session.user}
        viewer={<LessonContentViewer data={lessonData} />}
        actionSlot={actionSlot}
        commentsSection={
          <LessonComments
            comments={comments}
            currentUserId={session.user.id}
            isPending={isPendingComment}
            activePrivacy={activePrivacy}
            onPrivacyChange={setActivePrivacy}
            onPostComment={(text, privacy) =>
              upsertComment({
                text,
                lessonTypeId: +params.lessonTypeId,
                privacy: privacy,
              })
            }
            onEditComment={(id, text, privacy) =>
              upsertComment({
                id,
                text,
                lessonTypeId: +params.lessonTypeId,
                privacy: privacy,
              })
            }
          />
        }
      />
      <ResponsiveDialog
        title="upload answers"
        description=""
        onOpenChange={setOpenUpload}
        open={openUpload}
      >
        <AssignmentUploader
          attemptNumber={lessonData.attempts.length + 1}
          lessonTypeId={+params.lessonTypeId}
          quizId={lessonData.assignmentSettings.quidId}
          onSuccess={() => {
            queryClient.invalidateQueries(
              trpc.user.getLessonAssignment.queryOptions({
                classId: params.classId,
                lessonTypeId: +params.lessonTypeId,
              }),
            );
            setOpenUpload(false);
          }}
        />
      </ResponsiveDialog>
    </>
  );
}
