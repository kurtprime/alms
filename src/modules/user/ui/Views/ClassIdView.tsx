import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth-server";
import React from "react";
import StudentTab from "../components/StudentTab";
import ClassOverview from "../components/ClassOverview";
import AnnouncementView from "./AnnouncementView";
import GradeBookView from "./GradeBookView";

export default async function ClassIdView({ classId }: { classId: string }) {
  const session = await getCurrentUser();
  const isTeacher = session.user.role === "teacher";

  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultValue="overview"
        className="flex flex-col flex-1 overflow-hidden"
      >
        {/* Sticky Tabs Header */}
        <div className="sticky top-0 z-20 bg-background border-b">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="announcement"
              className="relative h-full rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Announcements
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-transform data-[state=inactive]:scale-x-0 data-[state=active]:scale-x-100" />
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="relative h-full rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Overview
              {/* Active Indicator Dot */}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-transform data-[state=inactive]:scale-x-0 data-[state=active]:scale-x-100" />
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="relative h-full rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Students
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-transform data-[state=inactive]:scale-x-0 data-[state=active]:scale-x-100" />
            </TabsTrigger>
            {isTeacher && (
              <TabsTrigger
                value="gradebook"
                className="relative h-full rounded-none px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Gradebook
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-transform data-[state=inactive]:scale-x-0 data-[state=active]:scale-x-100" />
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Content Area - Removed fixed heights for natural scrolling */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent
            value="announcement"
            className=" mt-0 focus-visible:outline-none"
          >
            <AnnouncementView classId={classId} session={session} />
          </TabsContent>

          <TabsContent
            value="overview"
            className=" mt-0 focus-visible:outline-none"
          >
            <ClassOverview session={session} classId={classId} />
          </TabsContent>

          <TabsContent
            value="students"
            className=" mt-0 focus-visible:outline-none"
          >
            <StudentTab classId={classId} />
          </TabsContent>

          {isTeacher && (
            <TabsContent
              value="gradebook"
              className=" mt-0 focus-visible:outline-none"
            >
              <GradeBookView session={session} classId={classId} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
