import { Tabs } from "@/components/ui/tabs";
import { getCurrentAdmin } from "@/lib/auth";
import SubjectIdHeader from "@/modules/admin/ui/subject/components/SubjectIdHeader";
import AdminSubjectIdView from "@/modules/admin/ui/subject/views/AdminSubjectIdView";
import React from "react";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function page({ params }: Props) {
  await getCurrentAdmin();
  const { subjectId } = await params;
  return (
    <Tabs defaultValue="lessons" className="pb-10">
      <SubjectIdHeader subjectId={subjectId} />
      <AdminSubjectIdView subjectId={subjectId} />
    </Tabs>
  );
}
