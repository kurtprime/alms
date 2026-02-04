import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth-server";
import React from "react";

export default async function ClassIdView({ classId }: { classId: string }) {
  const session = await getCurrentUser();

  const isTeacher = session.user.role === "teacher";
  return (
    <Tabs defaultValue="overview" className="bg-background h-screen py-3 pb-3">
      <TabsList variant="line" className="gap-4 w-full border-b">
        <TabsTrigger className={"text-md"} value={"announcement"}>
          Announcement
        </TabsTrigger>
        <TabsTrigger className={"text-md"} value="overview">
          Class Overview
        </TabsTrigger>
        <TabsTrigger className={"text-md"} value="students">
          Students
        </TabsTrigger>
        {isTeacher && (
          <TabsTrigger className={"text-md"} value="gradebook">
            Grade book
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="announcement">
        <div>Class Announcement Content for classId: {classId}</div>
      </TabsContent>
      <TabsContent value="overview">
        <div>Class Overview Content for classId: {classId}</div>
      </TabsContent>
      <TabsContent value="students">
        <div>Students Content for classId: {classId}</div>
      </TabsContent>
      {isTeacher && (
        <TabsContent value="gradebook">
          <div>Grade book Content for classId: {classId}</div>
        </TabsContent>
      )}
    </Tabs>
  );
}
