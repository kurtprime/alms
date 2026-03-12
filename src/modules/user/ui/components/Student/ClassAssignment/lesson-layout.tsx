"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Expand,
  UserViewLessonAssignment,
} from "@/modules/user/server/userSchema";

interface LessonLayoutProps {
  data: Expand<UserViewLessonAssignment>;
  sessionUser: { id: string }; // Minimal session info needed
  viewer: ReactNode; // The MDX/Doc Viewer passed from parent
  actionSlot: ReactNode; // The specific action (Mark Done / Submit Assignment)
  commentsSection: ReactNode; // The entire comments UI passed from parent
}

export function LessonLayout({
  data,
  sessionUser,
  viewer,
  actionSlot,
  commentsSection,
}: LessonLayoutProps) {
  const router = useRouter();
  const { name, status, createdAt, type } = data;

  const typeStyles = {
    handout: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    quiz: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    assignment:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b shadow-sm">
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
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate max-w-[200px] sm:max-w-md">
                {name || `Untitled ${type}`}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize border-0 text-[10px] px-1.5 py-0.5",
                    typeStyles[type],
                  )}
                >
                  {type}
                </Badge>
                <p className="text-[10px] text-slate-400">
                  {new Date(createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant={status === "published" ? "default" : "secondary"}
            className="capitalize"
          >
            {status}
          </Badge>
        </div>
      </header>

      {/* --- Main Grid Layout --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Content Viewer (Takes up 8/12) */}
          <div className="lg:col-span-8">
            <div className="h-[calc(100vh-120px)] sticky top-20 rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {viewer}
            </div>
          </div>

          {/* Right Column: Sidebar (Takes up 4/12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Action Slot (Submit / Mark Done) */}
            {actionSlot}

            {/* Attachments Section */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.documents && data.documents.length > 0 ? (
                  <div className="space-y-2">
                    {data.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-md bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-blue-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {doc.name || "Unnamed File"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {doc.fileType || "File"} •{" "}
                            {doc.size
                              ? `${(doc.size / 1024).toFixed(1)} KB`
                              : ""}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No files attached.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            {commentsSection}
          </div>
        </div>
      </main>
    </div>
  );
}
