import { Tabs } from "@/components/ui/tabs";
import { getCurrentAdmin } from "@/lib/auth";
import SubjectIdHeader from "@/modules/admin/ui/subject/components/SubjectIdHeader";
import { loadUseTabParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamServer";
import AdminSubjectIdView from "@/modules/admin/ui/subject/views/AdminSubjectIdView";
import { SearchParams } from "nuqs/server";
import React from "react";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
  searchParams: Promise<SearchParams>;
};

export default async function page({ params, searchParams }: Props) {
  await getCurrentAdmin();
  const { subjectId } = await params;
  const { tab } = await loadUseTabParams(searchParams);
  return (
    <Tabs defaultValue={tab} className="w-full h-full  flex flex-col gap-0">
      <SubjectIdHeader subjectId={subjectId} />
      <AdminSubjectIdView />
    </Tabs>
  );
}
