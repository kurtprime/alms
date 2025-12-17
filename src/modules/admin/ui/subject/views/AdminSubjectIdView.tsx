"use client";

import { TabsContent } from "@/components/ui/tabs";
import AdminHandleLessons from "../components/AdminHandleLessons";

export default function AdminSubjectIdView() {
  return (
    <>
      <TabsContent className="h-full bg-red" value="lessons">
        <AdminHandleLessons />
      </TabsContent>
      <TabsContent value="grades">grades</TabsContent>
      <TabsContent value="students">students</TabsContent>
      <TabsContent value="*">does not exist</TabsContent>
    </>
  );
}
