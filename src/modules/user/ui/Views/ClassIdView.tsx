import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth-server";
import React from "react";
import StudentTab from "../components/StudentTab";
import ClassOverview from "../components/ClassOverview";

export default async function ClassIdView({ classId }: { classId: string }) {
  const session = await getCurrentUser();

  const isTeacher = session.user.role === "teacher";
  return (
    <Tabs
      defaultValue="overview"
      className="bg-background h-screen py-3 pb-3 m-0"
    >
      <TabsList variant="line" className="md:gap-4 flex w-full border-b">
        <TabsTrigger className={"text-xs sm:text-md"} value={"announcement"}>
          Announcement
        </TabsTrigger>
        <TabsTrigger className={"text-xs sm:text-md"} value="overview">
          Class Overview
        </TabsTrigger>
        <TabsTrigger className={"text-xs sm:text-md"} value="students">
          Students
        </TabsTrigger>
        {isTeacher && (
          <TabsTrigger className={"text-xs sm:text-md"} value="gradebook">
            Grade book
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="announcement">
        <div>Class Announcement Content for classId: {classId}</div>
      </TabsContent>
      <TabsContent value="overview">
        <ClassOverview session={session} classId={classId} />
      </TabsContent>
      <TabsContent value="students">
        <StudentTab classId={classId} />
      </TabsContent>
      {isTeacher && (
        <TabsContent value="gradebook">
          <div>Grade book Content for classId: {classId}</div>
        </TabsContent>
      )}
    </Tabs>
  );
}
