import { Tabs } from "@/components/ui/tabs";
import AdminSubjectIdView from "@/modules/admin/ui/subject/views/AdminSubjectIdView";
import React from "react";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function page({ params }: Props) {
  const { subjectId } = await params;
  return (
    <Tabs defaultValue="lessons" className="pb-10">
      <AdminSubjectIdView subjectId={subjectId} />;
    </Tabs>
  );
}
