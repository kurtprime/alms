"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MessageSquare,
  Pencil,
  X,
  Check,
  Lock,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserCommentData } from "@/modules/user/server/userSchema";

interface LessonCommentsProps {
  comments: UserCommentData;
  currentUserId: string;
  isPending: boolean;
  activePrivacy: "public" | "private"; // Controlled by parent
  onPrivacyChange: (privacy: "public" | "private") => void; // Callback to parent
  onPostComment: (text: string, privacy: "public" | "private") => void;
  onEditComment: (
    id: number,
    text: string,
    privacy: "public" | "private",
  ) => void;
}

export function LessonComments({
  comments,
  currentUserId,
  isPending,
  activePrivacy,
  onPrivacyChange,
  onPostComment,
  onEditComment,
}: LessonCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const handlePost = () => {
    if (!newComment.trim()) return;
    // Post with the currently active privacy tab
    onPostComment(newComment, activePrivacy);
    setNewComment("");
  };

  const handleSaveEdit = () => {
    if (!editText.trim() || !editingId) return;
    // Edit preserves the existing privacy of the comment (or you could add a dropdown to change it)
    // For now, we assume editing keeps the current tab's privacy context or the comment's original privacy.
    // Since we are in a specific tab view, let's pass the activePrivacy or the comment's original privacy.
    // Ideally, editing shouldn't change privacy unless intended. Let's use activePrivacy for simplicity here.
    onEditComment(editingId, editText, activePrivacy);
    setEditingId(null);
    setEditText("");
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-0">
        {/* Tabs for Switching Views */}
        <Tabs
          value={activePrivacy}
          onValueChange={(v) => onPrivacyChange(v as "public" | "private")}
        >
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-2">
              <MessageSquare className="h-4 w-4" />
              Discussion
            </CardTitle>
            <TabsList className="h-8">
              <TabsTrigger value="public" className="text-xs h-7 px-3 gap-1">
                <Globe className="h-3 w-3" /> Public
              </TabsTrigger>
              <TabsTrigger value="private" className="text-xs h-7 px-3 gap-1">
                <Lock className="h-3 w-3" /> Private
              </TabsTrigger>
            </TabsList>
          </div>

          {/* We use a single content structure but the data (comments) changes via props */}
          <TabsContent
            value={activePrivacy}
            className="mt-0 focus-visible:outline-none focus-visible:ring-0 ring-0 border-0 p-0"
          >
            <CardContent className="space-y-4 p-0 pt-4">
              {/* Input Area */}
              <div className="space-y-2">
                <Textarea
                  placeholder={`Add a ${activePrivacy} comment...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={isPending}
                  rows={2}
                  className="resize-none text-sm bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">
                    {activePrivacy === "private"
                      ? "Only you and the teacher can see this."
                      : "Everyone can see this."}
                  </span>
                  <Button
                    size="sm"
                    disabled={isPending || !newComment.trim()}
                    onClick={handlePost}
                  >
                    {isPending && !editingId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments List */}
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No {activePrivacy} comments yet.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "group relative p-2 rounded-lg transition-colors",
                          editingId === comment.id &&
                            "bg-slate-100 dark:bg-slate-800 rounded-lg",
                        )}
                      >
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user.image || ""} />
                            <AvatarFallback>
                              {comment.user.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {comment.user.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(
                                  comment.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Edit Mode vs View Mode */}
                            {editingId === comment.id ? (
                              <div className="space-y-2 pt-1">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="text-sm bg-white dark:bg-slate-950"
                                  rows={2}
                                />
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setEditingId(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={handleSaveEdit}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {comment.text}
                              </p>
                            )}
                          </div>

                          {/* Edit Button */}
                          {comment.userId === currentUserId &&
                            editingId !== comment.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.text);
                                }}
                              >
                                <Pencil className="h-3 w-3 text-slate-400" />
                              </Button>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
