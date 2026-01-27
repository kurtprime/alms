import { Tabs } from "@/components/ui/tabs";
import { classSubjects } from "@/db/schema";
import { db } from "@/index";
import { getCurrentAdmin } from "@/lib/auth";
import SubjectIdHeader from "@/modules/admin/ui/subject/components/SubjectIdHeader";
import {
  loadUseLessonTypeParams,
  loadUseTabParams,
} from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamServer";
import AdminSubjectIdView from "@/modules/admin/ui/subject/views/AdminSubjectIdView";
import { eq } from "drizzle-orm";
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

  const [subjectExist] = await db
    .select({ id: classSubjects.id })
    .from(classSubjects)
    .where(eq(classSubjects.id, subjectId))
    .limit(1);

  if (!subjectExist) {
    return <div className="p-10">Subject not found</div>;
  }

  return (
    <Tabs defaultValue={tab} className="w-full h-full  flex flex-col gap-0">
      <SubjectIdHeader subjectId={subjectId} />
      <AdminSubjectIdView />
    </Tabs>
  );
}
