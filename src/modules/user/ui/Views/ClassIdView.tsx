import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth-server";
import React from "react";
import StudentTab from "../components/StudentTab";
import ClassOverview from "../components/ClassOverview";
import AnnouncementView from "./AnnouncementView";
import GradeBookView from "./GradeBookView";
import { cn } from "@/lib/utils";

export default async function ClassIdView({ classId }: { classId: string }) {
  const session = await getCurrentUser();
  const isTeacher = session.user.role === "teacher";

  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultValue="overview"
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* Sticky Header with Bottom Border */}
        <div className="sticky top-0 z-20 bg-background border-b">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 px-4">
            <TabsTrigger
              value="announcement"
              className={cn(
                "relative h-full rounded-none px-4 text-sm font-medium transition-colors",
                "border-b-2 border-transparent", // Default state: invisible border
                "hover:text-foreground hover:bg-muted/50", // Hover state
                "data-[state=active]:text-foreground data-[state=active]:border-primary", // Active state: visible border
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", // Focus management
              )}
            >
              Announcements
            </TabsTrigger>

            <TabsTrigger
              value="overview"
              className={cn(
                "relative h-full rounded-none px-4 text-sm font-medium transition-colors",
                "border-b-2 border-transparent",
                "hover:text-foreground hover:bg-muted/50",
                "data-[state=active]:text-foreground data-[state=active]:border-primary",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              )}
            >
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="students"
              className={cn(
                "relative h-full rounded-none px-4 text-sm font-medium transition-colors",
                "border-b-2 border-transparent",
                "hover:text-foreground hover:bg-muted/50",
                "data-[state=active]:text-foreground data-[state=active]:border-primary",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              )}
            >
              Students
            </TabsTrigger>

            {isTeacher && (
              <TabsTrigger
                value="gradebook"
                className={cn(
                  "relative h-full rounded-none px-4 text-sm font-medium transition-colors",
                  "border-b-2 border-transparent",
                  "hover:text-foreground hover:bg-muted/50",
                  "data-[state=active]:text-foreground data-[state=active]:border-primary",
                  "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                )}
              >
                Gradebook
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent
            value="announcement"
            className="m-0 focus-visible:outline-none"
          >
            <AnnouncementView classId={classId} session={session} />
          </TabsContent>

          <TabsContent
            value="overview"
            className="m-0 focus-visible:outline-none"
          >
            <ClassOverview session={session} classId={classId} />
          </TabsContent>

          <TabsContent
            value="students"
            className="m-0 focus-visible:outline-none"
          >
            <StudentTab classId={classId} />
          </TabsContent>

          {isTeacher && (
            <TabsContent
              value="gradebook"
              className="m-0 focus-visible:outline-none"
            >
              <GradeBookView session={session} classId={classId} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
