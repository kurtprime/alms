import AdminSubjectIdView from "@/modules/admin/ui/subject/views/AdminSubjectIdView";
import React from "react";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function page({ params }: Props) {
  const { subjectId } = await params;
  return <AdminSubjectIdView subjectId={subjectId} />;
}
