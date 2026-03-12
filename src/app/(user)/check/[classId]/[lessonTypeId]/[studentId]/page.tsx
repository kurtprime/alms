import TeacherCheckView from "@/modules/user/ui/Views/TeacherCheckView";
import React from "react";

export default async function page({
  params,
}: {
  params: Promise<{ classId: string; lessonTypeId: string }>;
}) {
  const param = await params;
  return <TeacherCheckView params={param} />;
}
