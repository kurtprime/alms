import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import SubjectTab from "../components/SubjectTab";

type Props = {
  subjectId: string;
};

export default function AdminSubjectIdView({ subjectId }: Props) {
  return (
    <Tabs defaultValue="lessons">
      <TabsList className="bg-accent">
        <TabsTrigger value="lessons">Lessons</TabsTrigger>
        <TabsTrigger value="grades">Grades</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
      </TabsList>
      <SubjectTab subjectId={subjectId} />
    </Tabs>
  );
}
