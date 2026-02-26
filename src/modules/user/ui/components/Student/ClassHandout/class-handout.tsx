"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Download,
  CalendarDays,
  Loader2,
  Check,
  Circle,
  Pencil,
  Send,
  MessageSquare,
  X,
} from "lucide-react";
import { LessonContentViewer } from "@/components/lesson-content-viewer";
import { useRouter } from "next/navigation";
import { Session } from "@/lib/auth-client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HandoutPageProps {
  params: { classId: string; lessonTypeId: number };
  session: Session;
}

export function ClassHandoutClient({ session, params }: HandoutPageProps) {
  const { classId, lessonTypeId } = params;
  const trpc = useTRPC();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const queryClient = useQueryClient();
  const { data: initialData } = useSuspenseQuery(
    trpc.user.getLessonHandout.queryOptions({
      classId,
      lessonTypeId: +lessonTypeId,
    }),
  );
  const { data: getIsDone } = useSuspenseQuery(
    trpc.user.getMarkIsDone.queryOptions({
      lessonTypeId: +lessonTypeId,
    }),
  );
  const { data: comments } = useSuspenseQuery(
    trpc.user.getCommentsInLessonType.queryOptions({
      lessonTypeId: +params.lessonTypeId,
      privacy: "public",
    }),
  );
  const { mutate: upsertComment, isPending: isPendingComment } = useMutation(
    trpc.user.upsertCommentInLessonType.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getCommentsInLessonType.queryOptions({
            lessonTypeId: +params.lessonTypeId,
            privacy: "public",
          }),
        );
      },
    }),
  );
  const {
    mutate: markAsDone,
    isPending,
    data: updateIsDone,
  } = useMutation(
    trpc.user.upsertMarkAsDone.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.user.getMarkIsDone.queryOptions({
            lessonTypeId: +lessonTypeId,
          }),
        );
      },
    }),
  );

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    upsertComment(
      {
        text: newComment,
        lessonTypeId: +lessonTypeId,
        privacy: "public",
      },
      {
        onSuccess: () => {
          setNewComment("");
        },
      },
    );
  };

  const startEditing = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // 5. Handler: Save Edit
  const saveEdit = (id: number) => {
    upsertComment(
      {
        id: id,
        text: editText,
        lessonTypeId: +lessonTypeId,
        privacy: "public",
      },
      {
        onSuccess: () => {
          cancelEdit();
        },
      },
    );
  };

  const isDone = updateIsDone ?? getIsDone;

  const { name, status, createdAt, documents } = initialData;
  const router = useRouter();

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar - Classroom Style */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                {name || "Untitled Handout"}
              </h1>
              <p className="text-xs text-slate-500">Handout</p>
            </div>
          </div>

          {/* Status & Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            <Badge
              variant={status === "published" ? "default" : "secondary"}
              className="capitalize"
            >
              {status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-2">
          {/* Left Column: The Integrated Document Viewer (Takes up 75% width) */}
          <div className="lg:col-span-3 h-[calc(100vh-120px)] sticky top-2">
            {/* 
               The LessonContentViewer handles:
               1. Rendering MDX Content
               2. Rendering the DocViewer for files
               3. Switching between them
            */}
            <LessonContentViewer data={initialData} />
          </div>

          {/* Right Column: Quick Access Sidebar (25% width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Documents / Attachments Card (For Downloading) */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="shrink-0 w-10 h-10 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                            {doc.name || "Unnamed File"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {doc.fileType || "File"}
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500">
                      No attachments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="border-none shadow-sm bg-slate-100 dark:bg-slate-800/50">
              <CardContent className="p-4">
                <Button
                  // Change variant based on state: "default" (solid) when done, "outline" when not
                  variant={isDone ? "default" : "outline"}
                  className={cn(
                    "w-full gap-2 transition-all duration-300",
                    // Custom green styling when Done
                    isDone &&
                      "bg-green-600 hover:bg-green-700 text-white border-green-600",
                  )}
                  disabled={isPending}
                  onClick={() => markAsDone({ lessonTypeId: +lessonTypeId })}
                >
                  {isPending ? (
                    // Loading State
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : isDone ? (
                    // Done State (Click to Undo)
                    <>
                      <Check className="h-4 w-4" />
                      Mark as Undone
                    </>
                  ) : (
                    // Not Done State (Click to Mark)
                    <>
                      <Circle className="h-4 w-4" />
                      Mark as Done
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Discussion ({comments?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. New Comment Input - Distinguished Area */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border space-y-2">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isPendingComment}
                    rows={2}
                    className="bg-white dark:bg-slate-950 resize-none border-none focus-visible:ring-1 focus-visible:ring-slate-200 shadow-none"
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      onClick={handlePostComment}
                      disabled={isPendingComment || !newComment.trim()}
                      className="gap-1"
                    >
                      {isPendingComment && !editingId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* 2. Comments List - Scrollable Area */}
                <ScrollArea className="h-[calc(100vh-730px)] pr-2 -mr-2">
                  {" "}
                  {/* Negative margin to balance scrollbar space */}
                  {comments && comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            "relative group p-2 rounded-lg transition-colors",
                            editingId === comment.id
                              ? "bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-100 dark:ring-blue-900"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                          )}
                        >
                          {/* Header: Avatar & Name */}
                          <div className="flex items-start gap-3">
                            {comment.user.image ? (
                              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                <AvatarImage src={comment.user.image} />
                                <AvatarFallback className="text-xs font-bold">
                                  {comment.user?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <GeneratedAvatar
                                seed={separateFullName(comment.user.name).join(
                                  " ",
                                )}
                                variant="initials"
                                className="size-8" /* Slightly smaller for density */
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {comment.user.name}
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  {new Date(
                                    comment.createdAt,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>

                              {/* Body: Content or Edit Mode */}
                              {editingId === comment.id ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editText}
                                    onChange={(e) =>
                                      setEditText(e.target.value)
                                    }
                                    rows={2}
                                    disabled={isPendingComment}
                                    className="bg-white dark:bg-slate-950 text-sm"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={cancelEdit}
                                      disabled={isPendingComment}
                                    >
                                      <X className="h-3 w-3 mr-1" /> Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 px-3"
                                      onClick={() => saveEdit(comment.id)}
                                      disabled={isPendingComment}
                                    >
                                      {isPendingComment ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                                  {comment.text}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Edit Button - Positioned Absolutely for minimal layout shift */}
                          {comment.userId === session.user.id &&
                            editingId !== comment.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
                                onClick={() =>
                                  startEditing(comment.id, comment.text)
                                }
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        No comments yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
